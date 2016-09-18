require('source-map-support').install();

const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');
const mkdirp  = require('mkdirp');
const palette = require('./palette');
const PNG     = require('pngjs').PNG;

if (require.main === module) cli();

function constant(str) : number {
  return  str.charCodeAt(0)        |
         (str.charCodeAt(1) <<  8) |
         (str.charCodeAt(2) << 16) |
         (str.charCodeAt(3) << 24);
}

export function* gaf(buffer: Buffer, options = {}) {
  const version = buffer.readUInt32LE(0);
  const count   = buffer.readUInt32LE(4);
  const unknown = buffer.readUInt32LE(8);
  assert(version == 0x00010100);
  for (let i = 0, offset = 12;i < count;++i, offset += 4) {
    const entry_offset = buffer.readUInt32LE(offset);
    yield* frames(buffer, entry_offset, options);
  }
}

function* frames(buffer, offset, options) : Iterable<any> {

  const frame_count = buffer.readUInt16LE(offset);
  const unknown1    = buffer.readUInt16LE(offset + 2);
  const unknown2    = buffer.readUInt16LE(offset + 4);

  let name = buffer.toString('ascii', offset + 8, offset + 40);
  const name_length = name.indexOf('\0');
  if (name_length != -1) name = name.substr(0, name_length);
  offset += 40;
  const frames = [];
  for (let i = 0;i < frame_count;++i, offset += 8) {
    const frame_offset = buffer.readUInt32LE(offset);
    const unknown3     = buffer.readUInt32LE(offset + 4);
    frames.push(frame(buffer, frame_offset, options));
  }
  yield { name, frames };
}

function copy_rgba(buffer, out, width: number, height: number) {
  for (let i = 0;i < buffer.length;++i) {
    const c = buffer[i] * 4;
    out[i*4 + 0] = palette[c + 0];
    out[i*4 + 1] = palette[c + 1];
    out[i*4 + 2] = palette[c + 2];
    out[i*4 + 3] = palette[c + 3];
  }
}

function decode_rgba(buffer, out, width, height) {
  console.log('decode_rgba');
  let p = 0;
  for (let y = 0;y < height;++y) {
    const count = buffer.readUInt16LE(p);
    p += 2;
    const e = p + count;
    for (let x = 0;p < e;) {
      const mask = buffer[p++];
      if ((mask & 0x01) == 0x01) x += mask >>> 1;
      else if ((mask & 0x02) == 0x02) {
        const c = buffer[p++] * 4;
        const l = (mask >>> 2) + 1;
        for (let j = 0;j < l;++j, ++x) {
          out[y * width * 4 + x * 4 + 0] = palette[c + 0];
          out[y * width * 4 + x * 4 + 1] = palette[c + 1];
          out[y * width * 4 + x * 4 + 2] = palette[c + 2];
          out[y * width * 4 + x * 4 + 3] = palette[c + 3];
        }
      }
      else {
        const l = (mask >>> 2) + 1;
        for (let j = 0;j < l;++j, ++x) {
          const c = buffer[p++] * 4;
          out[y * width * 4 + x * 4 + 0] = palette[c + 0];
          out[y * width * 4 + x * 4 + 1] = palette[c + 1];
          out[y * width * 4 + x * 4 + 2] = palette[c + 2];
          out[y * width * 4 + x * 4 + 3] = palette[c + 3];
        }
      }
    }
  }
}

function frame(buffer, offset, options) : any {
  const width          = buffer.readUInt16LE(offset);
  const height         = buffer.readUInt16LE(offset + 2);
  const xpos           = buffer.readInt16LE(offset + 4);
  const ypos           = buffer.readInt16LE(offset + 6);
  const unknown1       = buffer[offset + 8];
  const compressed     = buffer[offset + 9];
  const subframe_count = buffer.readUInt16LE(offset + 10);
  const unknown2       = buffer.readUInt32LE(offset + 12);
  const data_offset    = buffer.readUInt32LE(offset + 16);
  const unknown3       = buffer.readUInt16LE(offset + 20);
  const unknown4       = buffer.readUInt16LE(offset + 22);
  const unknown5       = buffer.slice(offset + 20, offset + 24).join(',');
  const pixels         = Buffer.alloc(width * height * 4);

  if (options.verbose) {
    console.log([unknown1, unknown2, unknown3, unknown4, unknown5]);
    console.log([width, height, xpos, ypos, width*height]);
    console.log([offset, data_offset]);
  }
  if (subframe_count == 0 && !compressed) {
    const data = buffer.slice(data_offset, data_offset + width * height);
    copy_rgba(data, pixels, width, height);
    return { width, height, data: pixels };
  }
  else if (subframe_count == 0 && compressed) {
    const data = buffer.slice(data_offset);
    decode_rgba(data, pixels, width, height);
    return { width, height, data: pixels };
  }
  else {
    for (let i = 0;i < subframe_count;++i) {
      const frame_offset = buffer.readUInt32LE(data_offset + i * 4);
      frame(buffer, frame_offset, options);
    }
    throw new Error('Unsupported format');
  }
}

function write_png(file, image) {
  const img = new PNG({width: image.width, height: image.height});
  img.data = image.data;
  fs.writeFileSync(file, PNG.sync.write(img));
}

function cli() {

  const options = require('yargs')
    .usage('$0 <cmd> [args]')
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output',
      default: false,
    })
    .option('trace', {
      describe: 'Print stack trace on error',
      default: false,
    })
    .help('help')
    .argv;

  for (let file of options._) {

    const resolved_name = path.resolve(process.cwd(), file);
    const source        = fs.readFileSync(resolved_name);
    const basename      = path.join(path.dirname(file), path.basename(file, path.extname(file)));
    if (options.verbose) console.log(resolved_name);
    for (let {name, frames} of gaf(source, options)) {
      const out_name = path.resolve(process.cwd(), path.join(basename, name) );
      if (options.verbose) console.log(`${out_name} [${frames.length}]`);
      if (frames.length == 1) {
        mkdirp.sync(path.dirname(out_name));
        write_png(out_name + '.png', frames[0]);
      }
      else {
        mkdirp.sync(out_name)
        frames.forEach( (frame, i) => write_png(path.join(out_name, i + '.png'), frame) );
      }
    }
  }
}
