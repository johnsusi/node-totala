"use strict";

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var mkdirp = require('mkdirp');
function constant(str) {
    return str.charCodeAt(0) | str.charCodeAt(1) << 8 | str.charCodeAt(2) << 16 | str.charCodeAt(3) << 24;
}
var temp_buffer_64k = new Buffer(65536);
var default_options = {
    out: __dirname,
    verbose: false
};
var options = default_options;
require('yargs').usage('$0 <cmd> [args]').option('out', {
    alias: 'o',
    describe: 'Expand files into dir',
    default: default_options.out
}).option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    default: default_options.verbose
}).command('x [files...]', 'eXtract files', {}, extract).help('help').argv;
function extract(argv) {
    options = {
        out: path.resolve(__dirname, argv.out || argv.o || default_options.out),
        verbose: argv.v || argv.verbose || default_options.verbose
    };
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _getIterator3.default)(argv.files), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var file = _step.value;

            var buffer = fs.readFileSync(path.resolve(__dirname, file));
            hpi_extract(buffer, options);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
}
function hpi_extract(buffer, _ref) {
    var out = _ref.out;

    console.log(out);
    var marker = buffer.readUInt32LE(0);
    var save_marker = buffer.readUInt32LE(4);
    var directory_size = buffer.readUInt32LE(8);
    var header_key = buffer.readUInt32LE(12);
    var directory_offset = buffer.readUInt32LE(16);
    var key = ~(header_key << 2 | header_key >>> 6);
    assert(marker == constant('HAPI'));
    for (var i = directory_offset; i < buffer.length; ++i) {
        var tkey = i ^ key;
        buffer[i] = tkey ^ ~buffer[i];
    }
    hpi_dir(buffer, directory_offset, out);
}
function hpi_dir(buffer, directory_offset, parent_name) {
    var count = buffer.readUInt32LE(directory_offset);
    var offset = buffer.readUInt32LE(directory_offset + 4);
    for (var i = 0, j = offset; i < count; ++i, j += 9) {
        var name_offset = buffer.readUInt32LE(j);
        var data_offset = buffer.readUInt32LE(j + 4);
        var is_dir = buffer[j + 8];
        var name = read_asciiz(buffer, name_offset);
        var full_name = path.join(parent_name, name);
        if (is_dir) {
            mkdirp.sync(full_name);
            hpi_dir(buffer, data_offset, full_name);
        } else {
            hpi_file(buffer, data_offset, full_name);
        }
    }
}
function hpi_file(buffer, offset, name) {
    var data_offset = buffer.readUInt32LE(offset);
    var file_size = buffer.readUInt32LE(offset + 4);
    var compressed = buffer[offset + 8];
    if (options.verbose) console.log('' + name);
    fs.writeFileSync(name, new Buffer(0));
    if (compressed) {
        var chunk_count = (file_size >>> 16) + (file_size % 65536 > 0 ? 1 : 0);
        var chunk_offset = data_offset + chunk_count * 4;
        for (var i = 0; i < chunk_count; ++i, data_offset += 4) {
            var chunk_size = buffer.readUInt32LE(data_offset);
            var marker = buffer.readUInt32LE(chunk_offset);
            var unknown1 = buffer[chunk_offset + 4];
            var compression = buffer[chunk_offset + 5];
            var encrypted = buffer[chunk_offset + 6];
            var compressed_size = buffer.readUInt32LE(chunk_offset + 7);
            var decompressed_size = buffer.readUInt32LE(chunk_offset + 11);
            var checksum = buffer.readUInt32LE(chunk_offset + 15);
            assert(marker == constant('SQSH'));
            var compressed_buffer = buffer.slice(chunk_offset + 19, chunk_offset + 19 + compressed_size);
            var decompressed_buffer = compressed_buffer;
            if (encrypted) decrypt(compressed_buffer);
            if (compression == 1) {
                assert(decompressed_size <= temp_buffer_64k.length);
                decompressed_buffer = temp_buffer_64k.slice(0, decompressed_size);
                decompress(compressed_buffer, decompressed_buffer);
            } else if (compression == 2) {
                throw new Error('zlib decompression not yet supported');
            }
            if (options.verbose) console.log(decompressed_buffer.length);
            fs.appendFileSync(name, decompressed_buffer);
            chunk_offset += chunk_size;
        }
    }
}
function read_asciiz(buffer, offset) {
    var end = offset;
    while (buffer[end]) {
        ++end;
    }return buffer.toString('ascii', offset, end);
}
function decrypt(buffer) {
    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = buffer[i] - i ^ i;
    }
}
function decompress(inbuff, out) {
    var window = new Array(4096);
    var done = false;
    var inptr = 0;
    var outptr = 0;
    var outbufptr = 1;
    var mask = 1;
    var tag = inbuff[inptr++];
    while (!done) {
        if ((mask & tag) == 0) {
            out[outptr++] = inbuff[inptr];
            window[outbufptr] = inbuff[inptr];
            outbufptr = outbufptr + 1 & 0xFFF;
            inptr++;
        } else {
            var count = inbuff.readUInt16LE(inptr);
            inptr += 2;
            var inbufptr = count >>> 4;
            if (inbufptr == 0) return outptr;else {
                count = (count & 0x0f) + 2;
                if (count >= 0) {
                    for (var x = 0; x < count; x++) {
                        out[outptr++] = window[inbufptr];
                        window[outbufptr] = window[inbufptr];
                        inbufptr = inbufptr + 1 & 0xFFF;
                        outbufptr = outbufptr + 1 & 0xFFF;
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
//# sourceMappingURL=hpi.js.map