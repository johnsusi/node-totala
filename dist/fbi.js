"use strict";

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _marked = [parser].map(_regenerator2.default.mark);

var fs = require('fs');
var path = require('path');
function parser(source) {
    var buffer, prev, tag, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, sc;

    return _regenerator2.default.wrap(function parser$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    buffer = '', prev = null, tag = null;
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context.prev = 4;
                    _iterator = (0, _getIterator3.default)(source);

                case 6:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                        _context.next = 68;
                        break;
                    }

                    sc = _step.value;

                    if (!(sc == '[' && !tag)) {
                        _context.next = 12;
                        break;
                    }

                    tag = '[';
                    _context.next = 64;
                    break;

                case 12:
                    if (!(sc == ']' && tag == '[')) {
                        _context.next = 19;
                        break;
                    }

                    _context.next = 15;
                    return { type: 'section', data: buffer.trim() };

                case 15:
                    buffer = '';
                    tag = null;
                    _context.next = 64;
                    break;

                case 19:
                    if (!(sc == '{' && !tag)) {
                        _context.next = 22;
                        break;
                    }

                    _context.next = 64;
                    break;

                case 22:
                    if (!(sc == '}' && !tag)) {
                        _context.next = 27;
                        break;
                    }

                    _context.next = 25;
                    return { type: 'close' };

                case 25:
                    _context.next = 64;
                    break;

                case 27:
                    if (!(sc == '=' && !tag)) {
                        _context.next = 34;
                        break;
                    }

                    _context.next = 30;
                    return { type: 'key', data: buffer.trim() };

                case 30:
                    buffer = '';
                    tag = '=';
                    _context.next = 64;
                    break;

                case 34:
                    if (!(sc == ';' && tag == '=')) {
                        _context.next = 41;
                        break;
                    }

                    _context.next = 37;
                    return { type: 'value', data: buffer };

                case 37:
                    buffer = '';
                    tag = null;
                    _context.next = 64;
                    break;

                case 41:
                    if (!(sc == '/' && prev == '/' && !tag)) {
                        _context.next = 45;
                        break;
                    }

                    tag = '/';
                    _context.next = 64;
                    break;

                case 45:
                    if (!(sc == '\n' && tag == '/')) {
                        _context.next = 52;
                        break;
                    }

                    _context.next = 48;
                    return { type: 'comment', data: buffer.slice(1).trim() };

                case 48:
                    buffer = '';
                    tag = null;
                    _context.next = 64;
                    break;

                case 52:
                    if (!(sc == '*' && prev == '/' && !tag)) {
                        _context.next = 56;
                        break;
                    }

                    tag = '*';
                    _context.next = 64;
                    break;

                case 56:
                    if (!(sc == '/' && prev == '*' && tag == '*')) {
                        _context.next = 63;
                        break;
                    }

                    _context.next = 59;
                    return { type: 'comment', data: buffer.slice(1, -1).trim() };

                case 59:
                    buffer = '';
                    tag = null;
                    _context.next = 64;
                    break;

                case 63:
                    if (tag || !/\s/.test(sc)) buffer += sc;

                case 64:
                    prev = sc;

                case 65:
                    _iteratorNormalCompletion = true;
                    _context.next = 6;
                    break;

                case 68:
                    _context.next = 74;
                    break;

                case 70:
                    _context.prev = 70;
                    _context.t0 = _context['catch'](4);
                    _didIteratorError = true;
                    _iteratorError = _context.t0;

                case 74:
                    _context.prev = 74;
                    _context.prev = 75;

                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }

                case 77:
                    _context.prev = 77;

                    if (!_didIteratorError) {
                        _context.next = 80;
                        break;
                    }

                    throw _iteratorError;

                case 80:
                    return _context.finish(77);

                case 81:
                    return _context.finish(74);

                case 82:
                case 'end':
                    return _context.stop();
            }
        }
    }, _marked[0], this, [[4, 70, 74, 82], [75,, 77, 81]]);
}
function parse(source, _ref) {
    var _ref$verbose = _ref.verbose;
    var verbose = _ref$verbose === undefined ? false : _ref$verbose;
    var _ref$comments = _ref.comments;
    var comments = _ref$comments === undefined ? false : _ref$comments;

    var result = {},
        stack = [result];
    var it = result,
        key = null;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = (0, _getIterator3.default)(parser(source)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var cmd = _step2.value;

            switch (cmd.type) {
                case 'section':
                    {
                        stack.push(it);
                        it = it[cmd.data] = {};
                        break;
                    }
                case 'key':
                    key = cmd.data;
                    break;
                case 'value':
                    {
                        var value = isNaN(cmd.data) ? cmd.data : new Number(cmd.data);
                        if (key in it) console.warn(key + ' will be overwritten');
                        it[key] = value;
                        break;
                    }
                case 'close':
                    it = stack.pop();
                    break;
                case 'comment':
                    {
                        if (comments) {
                            if (!('comments' in result)) result['comments'] = [];
                            result['comments'].push(cmd.data);
                        }
                        break;
                    }
                default:
                    break;
            }
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

    return result;
}
exports.parse = parse;
(function main() {
    var options = require('yargs').usage('Usage: $0 file... [options]').option('verbose', {
        alias: 'v',
        default: false,
        boolean: true
    }).option('comments', {
        default: false,
        boolean: true,
        description: 'Collect comments into an array named "comments"'
    }).option('pretty-print', {
        alias: ['pp'],
        default: false,
        boolean: true
    }).option('use-filename-as-root', {
        default: 0,
        number: true
    }).demand(1).help('help').argv;
    var files = options._;
    var arr_data = [];
    var obj_data = {};
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
        for (var _iterator3 = (0, _getIterator3.default)(files), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var file = _step3.value;

            if (options.verbose) console.log(file);
            var source = fs.readFileSync(file, { encoding: 'binary' }).trim();
            var data = parse(source, options);
            if (options.useFilenameAsRoot > 0) {
                var names = [];
                for (var i = 1, p = path.dirname(file); i < options.useFilenameAsRoot; ++i) {
                    names.unshift(path.basename(p));
                    p = path.dirname(p);
                }
                var node = obj_data;
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = (0, _getIterator3.default)(names), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var _name = _step4.value;

                        if (!(_name in node)) node = node[_name] = {};else node = node[_name];
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

                var name = path.basename(file, path.extname(file));
                node[name] = data;
            } else arr_data.push(data);
        }
    } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
            }
        } finally {
            if (_didIteratorError3) {
                throw _iteratorError3;
            }
        }
    }

    var result = options.useFilenameAsRoot > 0 ? obj_data : arr_data.length > 1 ? arr_data : arr_data[0];
    var json = (0, _stringify2.default)(result, null, options.pp ? 2 : 0);
    process.stdout.write(json);
})();
//# sourceMappingURL=fbi.js.map
//# sourceMappingURL=fbi.js.map