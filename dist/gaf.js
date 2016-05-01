"use strict";

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = [gaf, frames].map(_regenerator2.default.mark);

require('source-map-support').install();
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var mkdirp = require('mkdirp');
var palette = require('./palette');
var PNG = require('pngjs').PNG;
function constant(str) {
    return str.charCodeAt(0) | str.charCodeAt(1) << 8 | str.charCodeAt(2) << 16 | str.charCodeAt(3) << 24;
}
var options = require('yargs').usage('$0 <cmd> [args]').option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    default: false
}).option('trace', {
    describe: 'Print stack trace on error',
    default: false
}).help('help').argv;
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = (0, _getIterator3.default)(options._), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var file = _step.value;

        var resolved_name = path.resolve(process.cwd(), file);
        var source = fs.readFileSync(resolved_name);
        var basename = path.join(path.dirname(file), path.basename(file, path.extname(file)));
        console.log(resolved_name);
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            var _loop = function _loop() {
                var _step2$value = _step2.value;
                var name = _step2$value.name;
                var frames = _step2$value.frames;

                var out_name = path.resolve(process.cwd(), path.join(basename, name));
                console.log(out_name + ' [' + frames.length + ']');
                if (frames.length == 1) {
                    mkdirp.sync(path.dirname(out_name));
                    write_png(out_name + '.png', frames[0]);
                } else {
                    mkdirp.sync(out_name);
                    frames.forEach(function (frame, i) {
                        return write_png(path.join(out_name, i + '.png'), frame);
                    });
                }
            };

            for (var _iterator2 = (0, _getIterator3.default)(gaf(source)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                _loop();
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
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

function gaf(buffer) {
    var version, count, unknown, i, offset, entry_offset;
    return _regenerator2.default.wrap(function gaf$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    version = buffer.readUInt32LE(0);
                    count = buffer.readUInt32LE(4);
                    unknown = buffer.readUInt32LE(8);

                    assert(version == 0x00010100);
                    i = 0, offset = 12;

                case 5:
                    if (!(i < count)) {
                        _context.next = 11;
                        break;
                    }

                    entry_offset = buffer.readUInt32LE(offset);
                    return _context.delegateYield(frames(buffer, entry_offset), 't0', 8);

                case 8:
                    ++i, offset += 4;
                    _context.next = 5;
                    break;

                case 11:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked[0], this);
}
exports.gaf = gaf;
function frames(buffer, offset) {
    var frame_count, unknown1, unknown2, name, name_length, frames, i, frame_offset, unknown3;
    return _regenerator2.default.wrap(function frames$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    frame_count = buffer.readUInt16LE(offset);
                    unknown1 = buffer.readUInt16LE(offset + 2);
                    unknown2 = buffer.readUInt16LE(offset + 4);
                    name = buffer.toString('ascii', offset + 8, offset + 40);
                    name_length = name.indexOf('\0');

                    if (name_length != -1) name = name.substr(0, name_length);
                    offset += 40;
                    frames = [];

                    for (i = 0; i < frame_count; ++i, offset += 8) {
                        frame_offset = buffer.readUInt32LE(offset);
                        unknown3 = buffer.readUInt32LE(offset + 4);

                        frames.push(frame(buffer, frame_offset));
                    }
                    _context2.next = 11;
                    return { name: name, frames: frames };

                case 11:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _marked[1], this);
}
function copy_rgba(buffer, out, width, height) {
    for (var i = 0; i < buffer.length; ++i) {
        var c = buffer[i] * 4;
        out[i * 4 + 0] = palette[c + 0];
        out[i * 4 + 1] = palette[c + 1];
        out[i * 4 + 2] = palette[c + 2];
        out[i * 4 + 3] = palette[c + 3];
    }
}
function decode_rgba(buffer, out, width, height) {
    console.log('decode_rgba');
    var p = 0;
    for (var y = 0; y < height; ++y) {
        var count = buffer.readUInt16LE(p);
        p += 2;
        var e = p + count;
        for (var x = 0; p < e;) {
            var mask = buffer[p++];
            if ((mask & 0x01) == 0x01) x += mask >>> 1;else if ((mask & 0x02) == 0x02) {
                var c = buffer[p++] * 4;
                var l = (mask >>> 2) + 1;
                for (var j = 0; j < l; ++j, ++x) {
                    out[y * width * 4 + x * 4 + 0] = palette[c + 0];
                    out[y * width * 4 + x * 4 + 1] = palette[c + 1];
                    out[y * width * 4 + x * 4 + 2] = palette[c + 2];
                    out[y * width * 4 + x * 4 + 3] = palette[c + 3];
                }
            } else {
                var _l = (mask >>> 2) + 1;
                for (var _j = 0; _j < _l; ++_j, ++x) {
                    var _c = buffer[p++] * 4;
                    out[y * width * 4 + x * 4 + 0] = palette[_c + 0];
                    out[y * width * 4 + x * 4 + 1] = palette[_c + 1];
                    out[y * width * 4 + x * 4 + 2] = palette[_c + 2];
                    out[y * width * 4 + x * 4 + 3] = palette[_c + 3];
                }
            }
        }
    }
}
function frame(buffer, offset) {
    var width = buffer.readUInt16LE(offset);
    var height = buffer.readUInt16LE(offset + 2);
    var xpos = buffer.readInt16LE(offset + 4);
    var ypos = buffer.readInt16LE(offset + 6);
    var unknown1 = buffer[offset + 8];
    var compressed = buffer[offset + 9];
    var subframe_count = buffer.readUInt16LE(offset + 10);
    var unknown2 = buffer.readUInt32LE(offset + 12);
    var data_offset = buffer.readUInt32LE(offset + 16);
    var unknown3 = buffer.readUInt16LE(offset + 20);
    var unknown4 = buffer.readUInt16LE(offset + 22);
    var unknown5 = buffer.slice(offset + 20, offset + 24).join(',');
    var pixels = Buffer.alloc(width * height * 4);
    if (options.verbose) {
        console.log([unknown1, unknown2, unknown3, unknown4, unknown5]);
        console.log([width, height, xpos, ypos, width * height]);
        console.log([offset, data_offset]);
    }
    if (subframe_count == 0 && !compressed) {
        var data = buffer.slice(data_offset, data_offset + width * height);
        copy_rgba(data, pixels, width, height);
        return { width: width, height: height, data: pixels };
    } else if (subframe_count == 0 && compressed) {
        var _data = buffer.slice(data_offset);
        decode_rgba(_data, pixels, width, height);
        return { width: width, height: height, data: pixels };
    } else {
        for (var i = 0; i < subframe_count; ++i) {
            var frame_offset = buffer.readUInt32LE(data_offset + i * 4);
            frame(buffer, frame_offset);
        }
        throw new Error('Unsupported format');
    }
}
function write_png(file, image) {
    var img = new PNG({ width: image.width, height: image.height });
    img.data = image.data;
    fs.writeFileSync(file, PNG.sync.write(img));
}
//# sourceMappingURL=gaf.js.map
//# sourceMappingURL=data:application/json;base64,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QUNBLG9CQUFZLEtBQVosRUFBa0IsTUFBbEIsRUFBMEIsS0FBMUIsRUFBaUMsTUFBakM7QUFDQSxlQUFPLEVBQUUsWUFBRixFQUFTLGNBQVQsRUFBaUIsTUFBTSxNQUF2QixFQUFQO0FBQ0gsS0FKSSxNQUtBO0FBQ0QsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLGNBQXBCLEVBQW9DLEVBQUUsQ0FBdEMsRUFBeUM7QUFDckMsZ0JBQU0sZUFBZSxPQUFPLFlBQVAsQ0FBb0IsY0FBYyxJQUFJLENBQXRDLENBQXJCO0FBQ0Esa0JBQU0sTUFBTixFQUFjLFlBQWQ7QUFDSDtBQUNELGNBQU0sSUFBSSxLQUFKLENBQVUsb0JBQVYsQ0FBTjtBQUNIO0FBQ0o7QUFDRCxTQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUIsS0FBekIsRUFBZ0M7QUFDNUIsUUFBTSxNQUFNLElBQUksR0FBSixDQUFRLEVBQUUsT0FBTyxNQUFNLEtBQWYsRUFBc0IsUUFBUSxNQUFNLE1BQXBDLEVBQVIsQ0FBWjtBQUNBLFFBQUksSUFBSixHQUFXLE1BQU0sSUFBakI7QUFDQSxPQUFHLGFBQUgsQ0FBaUIsSUFBakIsRUFBdUIsSUFBSSxJQUFKLENBQVMsS0FBVCxDQUFlLEdBQWYsQ0FBdkI7QUFDSCIsImZpbGUiOiJnYWYuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcbnJlcXVpcmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpLmluc3RhbGwoKTtcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IHpsaWIgPSByZXF1aXJlKCd6bGliJyk7XG5jb25zdCBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAnKTtcbmNvbnN0IHBhbGV0dGUgPSByZXF1aXJlKCcuL3BhbGV0dGUnKTtcbmNvbnN0IFBORyA9IHJlcXVpcmUoJ3BuZ2pzJykuUE5HO1xuZnVuY3Rpb24gY29uc3RhbnQoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQ29kZUF0KDApIHxcbiAgICAgICAgKHN0ci5jaGFyQ29kZUF0KDEpIDw8IDgpIHxcbiAgICAgICAgKHN0ci5jaGFyQ29kZUF0KDIpIDw8IDE2KSB8XG4gICAgICAgIChzdHIuY2hhckNvZGVBdCgzKSA8PCAyNCk7XG59XG5jb25zdCBvcHRpb25zID0gcmVxdWlyZSgneWFyZ3MnKVxuICAgIC51c2FnZSgnJDAgPGNtZD4gW2FyZ3NdJylcbiAgICAub3B0aW9uKCd2ZXJib3NlJywge1xuICAgIGFsaWFzOiAndicsXG4gICAgZGVzY3JpYmU6ICdWZXJib3NlIG91dHB1dCcsXG4gICAgZGVmYXVsdDogZmFsc2UsXG59KVxuICAgIC5vcHRpb24oJ3RyYWNlJywge1xuICAgIGRlc2NyaWJlOiAnUHJpbnQgc3RhY2sgdHJhY2Ugb24gZXJyb3InLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxufSlcbiAgICAuaGVscCgnaGVscCcpXG4gICAgLmFyZ3Y7XG5mb3IgKGxldCBmaWxlIG9mIG9wdGlvbnMuXykge1xuICAgIGNvbnN0IHJlc29sdmVkX25hbWUgPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgZmlsZSk7XG4gICAgY29uc3Qgc291cmNlID0gZnMucmVhZEZpbGVTeW5jKHJlc29sdmVkX25hbWUpO1xuICAgIGNvbnN0IGJhc2VuYW1lID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShmaWxlKSwgcGF0aC5iYXNlbmFtZShmaWxlLCBwYXRoLmV4dG5hbWUoZmlsZSkpKTtcbiAgICBjb25zb2xlLmxvZyhyZXNvbHZlZF9uYW1lKTtcbiAgICBmb3IgKGxldCB7IG5hbWUsIGZyYW1lcyB9IG9mIGdhZihzb3VyY2UpKSB7XG4gICAgICAgIGNvbnN0IG91dF9uYW1lID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIHBhdGguam9pbihiYXNlbmFtZSwgbmFtZSkpO1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtvdXRfbmFtZX0gWyR7ZnJhbWVzLmxlbmd0aH1dYCk7XG4gICAgICAgIGlmIChmcmFtZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIG1rZGlycC5zeW5jKHBhdGguZGlybmFtZShvdXRfbmFtZSkpO1xuICAgICAgICAgICAgd3JpdGVfcG5nKG91dF9uYW1lICsgJy5wbmcnLCBmcmFtZXNbMF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWtkaXJwLnN5bmMob3V0X25hbWUpO1xuICAgICAgICAgICAgZnJhbWVzLmZvckVhY2goKGZyYW1lLCBpKSA9PiB3cml0ZV9wbmcocGF0aC5qb2luKG91dF9uYW1lLCBpICsgJy5wbmcnKSwgZnJhbWUpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uKiBnYWYoYnVmZmVyKSB7XG4gICAgY29uc3QgdmVyc2lvbiA9IGJ1ZmZlci5yZWFkVUludDMyTEUoMCk7XG4gICAgY29uc3QgY291bnQgPSBidWZmZXIucmVhZFVJbnQzMkxFKDQpO1xuICAgIGNvbnN0IHVua25vd24gPSBidWZmZXIucmVhZFVJbnQzMkxFKDgpO1xuICAgIGFzc2VydCh2ZXJzaW9uID09IDB4MDAwMTAxMDApO1xuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAxMjsgaSA8IGNvdW50OyArK2ksIG9mZnNldCArPSA0KSB7XG4gICAgICAgIGNvbnN0IGVudHJ5X29mZnNldCA9IGJ1ZmZlci5yZWFkVUludDMyTEUob2Zmc2V0KTtcbiAgICAgICAgeWllbGQqIGZyYW1lcyhidWZmZXIsIGVudHJ5X29mZnNldCk7XG4gICAgfVxufVxuZXhwb3J0cy5nYWYgPSBnYWY7XG5mdW5jdGlvbiogZnJhbWVzKGJ1ZmZlciwgb2Zmc2V0KSB7XG4gICAgY29uc3QgZnJhbWVfY291bnQgPSBidWZmZXIucmVhZFVJbnQxNkxFKG9mZnNldCk7XG4gICAgY29uc3QgdW5rbm93bjEgPSBidWZmZXIucmVhZFVJbnQxNkxFKG9mZnNldCArIDIpO1xuICAgIGNvbnN0IHVua25vd24yID0gYnVmZmVyLnJlYWRVSW50MTZMRShvZmZzZXQgKyA0KTtcbiAgICBsZXQgbmFtZSA9IGJ1ZmZlci50b1N0cmluZygnYXNjaWknLCBvZmZzZXQgKyA4LCBvZmZzZXQgKyA0MCk7XG4gICAgY29uc3QgbmFtZV9sZW5ndGggPSBuYW1lLmluZGV4T2YoJ1xcMCcpO1xuICAgIGlmIChuYW1lX2xlbmd0aCAhPSAtMSlcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDAsIG5hbWVfbGVuZ3RoKTtcbiAgICBvZmZzZXQgKz0gNDA7XG4gICAgY29uc3QgZnJhbWVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZV9jb3VudDsgKytpLCBvZmZzZXQgKz0gOCkge1xuICAgICAgICBjb25zdCBmcmFtZV9vZmZzZXQgPSBidWZmZXIucmVhZFVJbnQzMkxFKG9mZnNldCk7XG4gICAgICAgIGNvbnN0IHVua25vd24zID0gYnVmZmVyLnJlYWRVSW50MzJMRShvZmZzZXQgKyA0KTtcbiAgICAgICAgZnJhbWVzLnB1c2goZnJhbWUoYnVmZmVyLCBmcmFtZV9vZmZzZXQpKTtcbiAgICB9XG4gICAgeWllbGQgeyBuYW1lLCBmcmFtZXMgfTtcbn1cbmZ1bmN0aW9uIGNvcHlfcmdiYShidWZmZXIsIG91dCwgd2lkdGgsIGhlaWdodCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGNvbnN0IGMgPSBidWZmZXJbaV0gKiA0O1xuICAgICAgICBvdXRbaSAqIDQgKyAwXSA9IHBhbGV0dGVbYyArIDBdO1xuICAgICAgICBvdXRbaSAqIDQgKyAxXSA9IHBhbGV0dGVbYyArIDFdO1xuICAgICAgICBvdXRbaSAqIDQgKyAyXSA9IHBhbGV0dGVbYyArIDJdO1xuICAgICAgICBvdXRbaSAqIDQgKyAzXSA9IHBhbGV0dGVbYyArIDNdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRlY29kZV9yZ2JhKGJ1ZmZlciwgb3V0LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgY29uc29sZS5sb2coJ2RlY29kZV9yZ2JhJyk7XG4gICAgbGV0IHAgPSAwO1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyArK3kpIHtcbiAgICAgICAgY29uc3QgY291bnQgPSBidWZmZXIucmVhZFVJbnQxNkxFKHApO1xuICAgICAgICBwICs9IDI7XG4gICAgICAgIGNvbnN0IGUgPSBwICsgY291bnQ7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyBwIDwgZTspIHtcbiAgICAgICAgICAgIGNvbnN0IG1hc2sgPSBidWZmZXJbcCsrXTtcbiAgICAgICAgICAgIGlmICgobWFzayAmIDB4MDEpID09IDB4MDEpXG4gICAgICAgICAgICAgICAgeCArPSBtYXNrID4+PiAxO1xuICAgICAgICAgICAgZWxzZSBpZiAoKG1hc2sgJiAweDAyKSA9PSAweDAyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IGJ1ZmZlcltwKytdICogNDtcbiAgICAgICAgICAgICAgICBjb25zdCBsID0gKG1hc2sgPj4+IDIpICsgMTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGw7ICsraiwgKyt4KSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFt5ICogd2lkdGggKiA0ICsgeCAqIDQgKyAwXSA9IHBhbGV0dGVbYyArIDBdO1xuICAgICAgICAgICAgICAgICAgICBvdXRbeSAqIHdpZHRoICogNCArIHggKiA0ICsgMV0gPSBwYWxldHRlW2MgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgb3V0W3kgKiB3aWR0aCAqIDQgKyB4ICogNCArIDJdID0gcGFsZXR0ZVtjICsgMl07XG4gICAgICAgICAgICAgICAgICAgIG91dFt5ICogd2lkdGggKiA0ICsgeCAqIDQgKyAzXSA9IHBhbGV0dGVbYyArIDNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGwgPSAobWFzayA+Pj4gMikgKyAxO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbDsgKytqLCArK3gpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYyA9IGJ1ZmZlcltwKytdICogNDtcbiAgICAgICAgICAgICAgICAgICAgb3V0W3kgKiB3aWR0aCAqIDQgKyB4ICogNCArIDBdID0gcGFsZXR0ZVtjICsgMF07XG4gICAgICAgICAgICAgICAgICAgIG91dFt5ICogd2lkdGggKiA0ICsgeCAqIDQgKyAxXSA9IHBhbGV0dGVbYyArIDFdO1xuICAgICAgICAgICAgICAgICAgICBvdXRbeSAqIHdpZHRoICogNCArIHggKiA0ICsgMl0gPSBwYWxldHRlW2MgKyAyXTtcbiAgICAgICAgICAgICAgICAgICAgb3V0W3kgKiB3aWR0aCAqIDQgKyB4ICogNCArIDNdID0gcGFsZXR0ZVtjICsgM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gZnJhbWUoYnVmZmVyLCBvZmZzZXQpIHtcbiAgICBjb25zdCB3aWR0aCA9IGJ1ZmZlci5yZWFkVUludDE2TEUob2Zmc2V0KTtcbiAgICBjb25zdCBoZWlnaHQgPSBidWZmZXIucmVhZFVJbnQxNkxFKG9mZnNldCArIDIpO1xuICAgIGNvbnN0IHhwb3MgPSBidWZmZXIucmVhZEludDE2TEUob2Zmc2V0ICsgNCk7XG4gICAgY29uc3QgeXBvcyA9IGJ1ZmZlci5yZWFkSW50MTZMRShvZmZzZXQgKyA2KTtcbiAgICBjb25zdCB1bmtub3duMSA9IGJ1ZmZlcltvZmZzZXQgKyA4XTtcbiAgICBjb25zdCBjb21wcmVzc2VkID0gYnVmZmVyW29mZnNldCArIDldO1xuICAgIGNvbnN0IHN1YmZyYW1lX2NvdW50ID0gYnVmZmVyLnJlYWRVSW50MTZMRShvZmZzZXQgKyAxMCk7XG4gICAgY29uc3QgdW5rbm93bjIgPSBidWZmZXIucmVhZFVJbnQzMkxFKG9mZnNldCArIDEyKTtcbiAgICBjb25zdCBkYXRhX29mZnNldCA9IGJ1ZmZlci5yZWFkVUludDMyTEUob2Zmc2V0ICsgMTYpO1xuICAgIGNvbnN0IHVua25vd24zID0gYnVmZmVyLnJlYWRVSW50MTZMRShvZmZzZXQgKyAyMCk7XG4gICAgY29uc3QgdW5rbm93bjQgPSBidWZmZXIucmVhZFVJbnQxNkxFKG9mZnNldCArIDIyKTtcbiAgICBjb25zdCB1bmtub3duNSA9IGJ1ZmZlci5zbGljZShvZmZzZXQgKyAyMCwgb2Zmc2V0ICsgMjQpLmpvaW4oJywnKTtcbiAgICBjb25zdCBwaXhlbHMgPSBCdWZmZXIuYWxsb2Mod2lkdGggKiBoZWlnaHQgKiA0KTtcbiAgICBpZiAob3B0aW9ucy52ZXJib3NlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFt1bmtub3duMSwgdW5rbm93bjIsIHVua25vd24zLCB1bmtub3duNCwgdW5rbm93bjVdKTtcbiAgICAgICAgY29uc29sZS5sb2coW3dpZHRoLCBoZWlnaHQsIHhwb3MsIHlwb3MsIHdpZHRoICogaGVpZ2h0XSk7XG4gICAgICAgIGNvbnNvbGUubG9nKFtvZmZzZXQsIGRhdGFfb2Zmc2V0XSk7XG4gICAgfVxuICAgIGlmIChzdWJmcmFtZV9jb3VudCA9PSAwICYmICFjb21wcmVzc2VkKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBidWZmZXIuc2xpY2UoZGF0YV9vZmZzZXQsIGRhdGFfb2Zmc2V0ICsgd2lkdGggKiBoZWlnaHQpO1xuICAgICAgICBjb3B5X3JnYmEoZGF0YSwgcGl4ZWxzLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgZGF0YTogcGl4ZWxzIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHN1YmZyYW1lX2NvdW50ID09IDAgJiYgY29tcHJlc3NlZCkge1xuICAgICAgICBjb25zdCBkYXRhID0gYnVmZmVyLnNsaWNlKGRhdGFfb2Zmc2V0KTtcbiAgICAgICAgZGVjb2RlX3JnYmEoZGF0YSwgcGl4ZWxzLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIHsgd2lkdGgsIGhlaWdodCwgZGF0YTogcGl4ZWxzIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1YmZyYW1lX2NvdW50OyArK2kpIHtcbiAgICAgICAgICAgIGNvbnN0IGZyYW1lX29mZnNldCA9IGJ1ZmZlci5yZWFkVUludDMyTEUoZGF0YV9vZmZzZXQgKyBpICogNCk7XG4gICAgICAgICAgICBmcmFtZShidWZmZXIsIGZyYW1lX29mZnNldCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBmb3JtYXQnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB3cml0ZV9wbmcoZmlsZSwgaW1hZ2UpIHtcbiAgICBjb25zdCBpbWcgPSBuZXcgUE5HKHsgd2lkdGg6IGltYWdlLndpZHRoLCBoZWlnaHQ6IGltYWdlLmhlaWdodCB9KTtcbiAgICBpbWcuZGF0YSA9IGltYWdlLmRhdGE7XG4gICAgZnMud3JpdGVGaWxlU3luYyhmaWxlLCBQTkcuc3luYy53cml0ZShpbWcpKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWdhZi5qcy5tYXAiXX0=