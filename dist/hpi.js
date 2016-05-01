"use strict";

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = [hpi, hpi_dir].map(_regenerator2.default.mark);

var assert = require('assert');
// const Buffer = require('buffer');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var mkdirp = require('mkdirp');
function constant(str) {
    return str.charCodeAt(0) | str.charCodeAt(1) << 8 | str.charCodeAt(2) << 16 | str.charCodeAt(3) << 24;
}
var temp_buffer_64k = Buffer.alloc(65536);
var default_options = {
    out: __dirname,
    verbose: false,
    trace: false
};
// let options = default_options;
var options = require('yargs').usage('$0 files... [options]').option('out', {
    alias: 'o',
    describe: 'Expand files into dir',
    string: true,
    demand: true
}).option('verbose', {
    alias: ['v'],
    describe: 'Verbose output',
    default: false,
    boolean: true
}).option('trace', {
    describe: 'Print stacktrace on errors',
    default: false,
    boolean: true
}).help('help').argv;
options.out = path.resolve(process.cwd(), options.out);
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = (0, _getIterator3.default)(options._), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var file = _step.value;

        try {
            var buffer = fs.readFileSync(path.resolve(process.cwd(), file));
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = (0, _getIterator3.default)(hpi(buffer)), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var _step5$value = _step5.value;
                    var name = _step5$value.name;
                    var data = _step5$value.data;

                    var full_name = path.resolve(options.out, name);
                    console.log(full_name);
                    mkdirp.sync(path.dirname(full_name));
                    fs.writeFileSync(full_name, data);
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }
        } catch (err) {
            if (options.trace) console.error(err.stack);else console.error(err);
        }
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

function hpi(buffer) {
    var marker, save_marker, directory_size, header_key, directory_offset, key, i, tkey, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, entry;

    return _regenerator2.default.wrap(function hpi$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    marker = buffer.readUInt32LE(0);
                    save_marker = buffer.readUInt32LE(4);
                    directory_size = buffer.readUInt32LE(8);
                    header_key = buffer.readUInt32LE(12);
                    directory_offset = buffer.readUInt32LE(16);

                    assert(marker == constant('HAPI'));
                    if (header_key) {
                        key = ~(header_key << 2 | header_key >>> 6);

                        for (i = directory_offset; i < buffer.length; ++i) {
                            tkey = i ^ key;

                            buffer[i] = tkey ^ ~buffer[i];
                        }
                    }
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context.prev = 10;
                    _iterator2 = (0, _getIterator3.default)(hpi_dir(buffer, directory_offset, ''));

                case 12:
                    if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                        _context.next = 19;
                        break;
                    }

                    entry = _step2.value;
                    _context.next = 16;
                    return entry;

                case 16:
                    _iteratorNormalCompletion2 = true;
                    _context.next = 12;
                    break;

                case 19:
                    _context.next = 25;
                    break;

                case 21:
                    _context.prev = 21;
                    _context.t0 = _context['catch'](10);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context.t0;

                case 25:
                    _context.prev = 25;
                    _context.prev = 26;

                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }

                case 28:
                    _context.prev = 28;

                    if (!_didIteratorError2) {
                        _context.next = 31;
                        break;
                    }

                    throw _iteratorError2;

                case 31:
                    return _context.finish(28);

                case 32:
                    return _context.finish(25);

                case 33:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked[0], this, [[10, 21, 25, 33], [26,, 28, 32]]);
}
exports.hpi = hpi;
function hpi_dir(buffer, directory_offset, parent_name) {
    var count, offset, i, j, name_offset, data_offset, is_dir, name, full_name, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, entry;

    return _regenerator2.default.wrap(function hpi_dir$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    count = buffer.readUInt32LE(directory_offset);
                    offset = buffer.readUInt32LE(directory_offset + 4);
                    i = 0, j = offset;

                case 3:
                    if (!(i < count)) {
                        _context2.next = 43;
                        break;
                    }

                    name_offset = buffer.readUInt32LE(j);
                    data_offset = buffer.readUInt32LE(j + 4);
                    is_dir = buffer[j + 8];
                    name = read_asciiz(buffer, name_offset);
                    full_name = path.join(parent_name, name);

                    if (!is_dir) {
                        _context2.next = 38;
                        break;
                    }

                    _iteratorNormalCompletion3 = true;
                    _didIteratorError3 = false;
                    _iteratorError3 = undefined;
                    _context2.prev = 13;
                    _iterator3 = (0, _getIterator3.default)(hpi_dir(buffer, data_offset, full_name));

                case 15:
                    if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
                        _context2.next = 22;
                        break;
                    }

                    entry = _step3.value;
                    _context2.next = 19;
                    return entry;

                case 19:
                    _iteratorNormalCompletion3 = true;
                    _context2.next = 15;
                    break;

                case 22:
                    _context2.next = 28;
                    break;

                case 24:
                    _context2.prev = 24;
                    _context2.t0 = _context2['catch'](13);
                    _didIteratorError3 = true;
                    _iteratorError3 = _context2.t0;

                case 28:
                    _context2.prev = 28;
                    _context2.prev = 29;

                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }

                case 31:
                    _context2.prev = 31;

                    if (!_didIteratorError3) {
                        _context2.next = 34;
                        break;
                    }

                    throw _iteratorError3;

                case 34:
                    return _context2.finish(31);

                case 35:
                    return _context2.finish(28);

                case 36:
                    _context2.next = 40;
                    break;

                case 38:
                    _context2.next = 40;
                    return hpi_file(buffer, data_offset, full_name);

                case 40:
                    ++i, j += 9;
                    _context2.next = 3;
                    break;

                case 43:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _marked[1], this, [[13, 24, 28, 36], [29,, 31, 35]]);
}
function hpi_file(buffer, offset, name) {
    var data_offset = buffer.readUInt32LE(offset);
    var file_size = buffer.readUInt32LE(offset + 4);
    var compressed = buffer[offset + 8];
    if (options.verbose) console.log('' + name);
    var file_buffer = Buffer.alloc(file_size);
    var file_offset = 0;
    // fs.writeFileSync(name, new Buffer(0));
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
            var check = 0;
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = (0, _getIterator3.default)(compressed_buffer), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var x = _step4.value;

                    check = check + x & 0xFFFFFFFF;
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            assert(check == checksum);
            if (encrypted) decrypt(compressed_buffer);
            if (compression == 1) {
                decompress(compressed_buffer, file_buffer.slice(file_offset, file_offset + decompressed_size));
            } else if (compression == 2) {
                zlib.unzipSync(compressed_buffer).copy(file_buffer, file_offset);
            } else {
                throw new Error('unknown compression');
            }
            file_offset += decompressed_size;
            chunk_offset += chunk_size;
        }
    } else throw new Error('uncompressed not yet supported');
    return { name: name, data: file_buffer };
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
//# sourceMappingURL=hpi.js.map