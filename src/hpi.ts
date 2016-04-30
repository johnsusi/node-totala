'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const zlib   = require('zlib');
const mkdirp = require('mkdirp');

function constant(str) : number {
  return  str.charCodeAt(0)        |
         (str.charCodeAt(1) <<  8) |
         (str.charCodeAt(2) << 16) |
         (str.charCodeAt(3) << 24);
}

const temp_buffer_64k = new Buffer(65536);

const default_options = {
  out: __dirname,
  verbose: false,
};

let options = default_options;

require('yargs')
  .usage('$0 <cmd> [args]')
  .option('out', {
    alias: 'o',
    describe: 'Expand files into dir',
    default: default_options.out,
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    default: default_options.verbose,
  })
  .command('x [files...]', 'eXtract files', {}, extract)
  .help('help')
  .argv;

  function extract(argv) {
    options = {
      out: path.resolve(__dirname, (argv.out || argv.o || default_options.out)),
      verbose: argv.v || argv.verbose || default_options.verbose,
    };
    for (let file of argv.files) {
      const buffer = fs.readFileSync(path.resolve(__dirname, file));
      hpi_extract(buffer, options);
    }
  }

  function hpi_extract(buffer, {out}) {
    console.log(out);
    const marker           = buffer.readUInt32LE(0);
    const save_marker      = buffer.readUInt32LE(4);
    const directory_size   = buffer.readUInt32LE(8);
    const header_key       = buffer.readUInt32LE(12);
    const directory_offset = buffer.readUInt32LE(16);
    const key = ~((header_key << 2) | (header_key >>> 6));

    assert(marker == constant('HAPI'));

    for (let i = directory_offset;i < buffer.length;++i) {

      const tkey = i ^ key;
      buffer[i] = tkey ^ (~buffer[i]);
    }

    hpi_dir(buffer, directory_offset, out);
  }

  function hpi_dir(buffer, directory_offset, parent_name) {
    const count = buffer.readUInt32LE(directory_offset);
    const offset = buffer.readUInt32LE(directory_offset + 4);
    for (let i = 0, j = offset; i < count;++i, j += 9) {
      const name_offset = buffer.readUInt32LE(j);
      const data_offset = buffer.readUInt32LE(j + 4);
      const is_dir = buffer[j+8];
      const name = read_asciiz(buffer, name_offset);
      const full_name = path.join(parent_name, name);
      if (is_dir) {
        mkdirp.sync(full_name);
        hpi_dir(buffer, data_offset, full_name);
      }
      else {
        hpi_file(buffer, data_offset, full_name);
      }
    }
  }

  function hpi_file(buffer, offset, name) {
    let data_offset = buffer.readUInt32LE(offset);
    const file_size   = buffer.readUInt32LE(offset + 4);
    const compressed  = buffer[offset + 8];
    if (options.verbose) console.log(`${name}`);
    fs.writeFileSync(name, new Buffer(0));
    if (compressed) {
      const chunk_count = (file_size >>> 16) + (file_size % 65536 > 0 ? 1 : 0);
      let chunk_offset  = data_offset + chunk_count * 4
      for (let i = 0;i < chunk_count;++i, data_offset += 4) {
        const chunk_size = buffer.readUInt32LE(data_offset);

        const marker            = buffer.readUInt32LE(chunk_offset);
        const unknown1          = buffer[chunk_offset + 4];
        const compression       = buffer[chunk_offset + 5];
        const encrypted         = buffer[chunk_offset + 6];
        const compressed_size   = buffer.readUInt32LE(chunk_offset + 7);
        const decompressed_size = buffer.readUInt32LE(chunk_offset + 11);
        const checksum          = buffer.readUInt32LE(chunk_offset + 15);

        assert(marker == constant('SQSH'));

        const compressed_buffer = buffer.slice(chunk_offset + 19, chunk_offset + 19 + compressed_size);
        let decompressed_buffer = compressed_buffer;
        if (encrypted) decrypt(compressed_buffer);
        if (compression == 1) {
          assert(decompressed_size <= temp_buffer_64k.length);
          decompressed_buffer = temp_buffer_64k.slice(0, decompressed_size);
          decompress(compressed_buffer, decompressed_buffer);
        }
        else if (compression == 2) {
          throw new Error('zlib decompression not yet supported');
        }
        if (options.verbose) console.log(decompressed_buffer.length);
        fs.appendFileSync(name, decompressed_buffer);
        chunk_offset += chunk_size;
      }
    }
  }

  function read_asciiz(buffer, offset) {
    let end = offset;
    while (buffer[end]) ++end;
    return buffer.toString('ascii', offset, end);
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
