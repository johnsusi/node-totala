"use strict";
function read_asciiz(buffer, offset, limit = 0) {
    if (offset == 0)
        return;
    let end = offset;
    if (!limit)
        limit = buffer.length;
    else
        limit += offset;
    while (end < limit && buffer[end])
        ++end;
    return buffer.toString('ascii', offset, end);
}
exports.read_asciiz = read_asciiz;
function constant(str) {
    return str.charCodeAt(0) |
        (str.charCodeAt(1) << 8) |
        (str.charCodeAt(2) << 16) |
        (str.charCodeAt(3) << 24);
}
exports.constant = constant;
//# sourceMappingURL=util.js.map