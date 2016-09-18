"use strict";
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { read_asciiz } = require('./util');
if (require.main === module)
    cli();
function ThreeDO(buffer) {
}
exports.ThreeDO = ThreeDO;
function* objects(buffer) {
    yield* object(buffer);
}
function* object(buffer, offset = 0) {
    const version = buffer.readUInt32LE(offset + 0);
    const vertex_count = buffer.readUInt32LE(offset + 4);
    const primitive_count = buffer.readUInt32LE(offset + 8);
    const selection = buffer.readInt32LE(offset + 12);
    const x = buffer.readInt32LE(offset + 16);
    const y = buffer.readInt32LE(offset + 20);
    const z = buffer.readInt32LE(offset + 24);
    const name_offset = buffer.readUInt32LE(offset + 28);
    const unknown2 = buffer.readUInt32LE(offset + 32);
    const vertex_offset = buffer.readUInt32LE(offset + 36);
    const primitive_offset = buffer.readUInt32LE(offset + 40);
    const sibling_offset = buffer.readUInt32LE(offset + 44);
    const child_offset = buffer.readUInt32LE(offset + 48);
    assert(version == 1);
    console.log(selection);
    const name = read_asciiz(buffer, name_offset);
    const vertex_array = vertexes(buffer, vertex_offset, vertex_count);
    const primitive_array = Array.from(primitives(buffer, primitive_offset, primitive_count));
    console.log(vertex_array);
    console.log(primitive_array);
    yield { name, x, y, z, };
    if (child_offset)
        yield* object(buffer, child_offset);
    if (sibling_offset)
        yield* object(buffer, sibling_offset);
}
function vertexes(buffer, offset, count) {
    const result = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; ++i) {
        result[i] = buffer.readUInt32LE(offset + i * 4);
    }
    return result;
}
function* primitives(buffer, offset, count) {
    for (let i = 0; i < count; ++i)
        yield primitive(buffer, offset + i * 32);
}
function primitive(buffer, offset) {
    const color = buffer.readUInt32LE(offset + 0);
    const index_count = buffer.readUInt32LE(offset + 4);
    const unknown1 = buffer.readUInt32LE(offset + 8);
    const index_offset = buffer.readUInt32LE(offset + 12);
    const texture_offset = buffer.readUInt32LE(offset + 16);
    const editor0 = buffer.readUInt32LE(offset + 20);
    const editor1 = buffer.readUInt32LE(offset + 24);
    const editor2 = buffer.readUInt32LE(offset + 28);
    return {
        color,
        indexes: indexes(buffer, index_offset, index_count),
        texture: read_asciiz(buffer, texture_offset),
    };
}
function indexes(buffer, offset, count) {
    const result = new Uint16Array(count);
    for (let i = 0; i < count; ++i) {
        result[i] = buffer.readUInt16LE(offset + i * 2);
    }
    return result;
}
function cli() {
    const options = require('yargs')
        .usage('$0 files... [options]')
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
    for (let file of options._) {
        try {
            const buffer = fs.readFileSync(path.resolve(process.cwd(), file));
            for (let { name, x, y, z } of objects(buffer)) {
                console.log(name, [x / 65536, y / 65536, z / 65536]);
            }
        }
        catch (err) {
            if (options.trace)
                console.error(err.stack);
            else
                console.error(err);
        }
    }
}
//# sourceMappingURL=3do.js.map