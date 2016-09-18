const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const zlib   = require('zlib');
const mkdirp = require('mkdirp');

const { constant, read_asciiz } = require('./util');

if (require.main === module) cli();

const temp_buffer_64k = Buffer.alloc(65536);

export function* hpi(buffer) {
  const marker           = buffer.readUInt32LE(0);
  const save_marker      = buffer.readUInt32LE(4);
  const directory_size   = buffer.readUInt32LE(8);
  const header_key       = buffer.readUInt32LE(12);
  const directory_offset = buffer.readUInt32LE(16);

  assert(marker == constant('HAPI'));

  if (header_key) {
    const key = ~((header_key << 2) | (header_key >>> 6));
    for (let i = directory_offset;i < buffer.length;++i) {
      const tkey = i ^ key;
      buffer[i] = tkey ^ (~buffer[i]);
    }
  }

  yield* hpi_dir(buffer, directory_offset, '');
}

function* hpi_dir(buffer, directory_offset, parent_name) {
  const count  = buffer.readUInt32LE(directory_offset);
  const offset = buffer.readUInt32LE(directory_offset + 4);
  for (let i = 0, j = offset; i < count;++i, j += 9) {
    const name_offset = buffer.readUInt32LE(j);
    const data_offset = buffer.readUInt32LE(j + 4);
    const directory   = buffer[j+8];
    const name        = read_asciiz(buffer, name_offset);
    const full_name   = path.join(parent_name, name);
    if (directory) yield* hpi_dir(buffer, data_offset, full_name);
    else yield hpi_file(buffer, data_offset, full_name);
  }
}

function hpi_file(buffer, offset, name) {
  let data_offset = buffer.readUInt32LE(offset);
  const file_size   = buffer.readUInt32LE(offset + 4);
  const compressed  = buffer[offset + 8];
  const file_buffer = Buffer.alloc(file_size);
  let file_offset = 0;
  if (compressed) {
    const chunk_count = (file_size >>> 16) + (file_size % 65536 > 0 ? 1 : 0);
    let chunk_offset  = data_offset + chunk_count * 4
    for (let i = 0;i < chunk_count;++i, data_offset += 4) {
      const chunk_size        = buffer.readUInt32LE(data_offset);
      const marker            = buffer.readUInt32LE(chunk_offset);
      const unknown1          = buffer[chunk_offset + 4];
      const compression       = buffer[chunk_offset + 5];
      const encrypted         = buffer[chunk_offset + 6];
      const compressed_size   = buffer.readUInt32LE(chunk_offset + 7);
      const decompressed_size = buffer.readUInt32LE(chunk_offset + 11);
      const checksum          = buffer.readUInt32LE(chunk_offset + 15);

      assert(marker == constant('SQSH'));

      const compressed_buffer = buffer.slice(chunk_offset + 19, chunk_offset + 19 + compressed_size);

      let check = 0;
      for (let x of compressed_buffer) check = (check + x) & 0xFFFFFFFF;
      assert(check == checksum);

      if (encrypted) decrypt(compressed_buffer);
      if (compression == 1) {
        decompress(compressed_buffer,
                   file_buffer.slice(file_offset,
                                     file_offset + decompressed_size));
      }
      else if (compression == 2) {
        zlib.unzipSync(compressed_buffer).copy(file_buffer, file_offset);
      }
      else {
        throw new Error('unknown compression');
      }
      file_offset += decompressed_size;
      chunk_offset += chunk_size;
    }
  }
  else throw new Error('uncompressed not yet supported');

  return {name, data: file_buffer};
}

function decrypt(buffer) {
  for (let i = 0;i < buffer.length;++i) {
    buffer[i] = (buffer[i] - i) ^ i;
  }
}

function decompress(inbuff, out) {

    const window = new Array(4096);

    let done = false;

    let inptr = 0;
    let outptr = 0;
    let outbufptr = 1;
    let mask = 1;
    let tag = inbuff[inptr++];

    while (!done) {
      if ((mask & tag) == 0) {
        out[outptr++] = inbuff[inptr];
        window[outbufptr] = inbuff[inptr];
        outbufptr = (outbufptr + 1) & 0xFFF;
        inptr++;
      }
      else {
        let count = inbuff.readUInt16LE(inptr);
        inptr += 2;
        let inbufptr = count >>> 4;
        if (inbufptr == 0)
          return outptr;
        else {
          count = (count & 0x0f) + 2;
          if (count >= 0) {
            for (let x = 0; x < count; x++) {
              out[outptr++] = window[inbufptr];
              window[outbufptr] = window[inbufptr];
              inbufptr = (inbufptr + 1) & 0xFFF;
              outbufptr = (outbufptr + 1) & 0xFFF;
            }
          }
        }
      }
      mask *= 2;
      if (mask & 0x0100) {
        mask = 1;
        tag = inbuff[inptr++];
      }
  }
  return outptr;
}

function cli() {

  const options = require('yargs')
    .usage('$0 files... [options]')
    .option('out', {
      alias: 'o',
      describe: 'Expand files into dir',
      string: true,
      demand: true,
    })
    .option('verbose', {
      alias: ['v'],
      describe: 'Verbose output',
      default: false,
      boolean: true,
    })
    .option('trace', {
      describe: 'Print stacktrace on errors',
      default: false,
      boolean: true,
    })
    .help('help')
    .argv;

  options.out = path.resolve(process.cwd(), options.out);
  for (let file of options._) {
    try {
      const buffer = fs.readFileSync(path.resolve(process.cwd(), file));
      for (let {name, data} of hpi(buffer)) {
        const full_name = path.resolve(options.out, name);
        if (options.verbose) console.log(full_name);
        mkdirp.sync(path.dirname(full_name));
        fs.writeFileSync(full_name, data);
      }
    }
    catch(err) {
      if (options.trace) console.error(err.stack);
      else console.error(err);
    }
  }
}
