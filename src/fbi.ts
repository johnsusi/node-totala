import * as fs   from 'fs';
import * as path from 'path';

if (require.main === module) cli();

function *parser(source) : Iterable<any> {
    let buffer = '', prev = null, tag = null;
    for (let sc of source) {
      if (sc == '[' && !tag) tag = '[';
      else if (sc == ']' && tag == '[') {
        yield { type: 'section', data: buffer.trim() };
        buffer = ''; tag = null;
      }
      else if (sc == '{' && !tag) {}
      else if (sc == '}' && !tag) yield {type: 'close'};
      else if (sc == '=' && !tag) {
        yield {type: 'key', data: buffer.trim()};
        buffer = ''; tag = '=';
      }
      else if (sc == ';' && tag == '=') {
        yield {type: 'value', data: buffer};
        buffer = ''; tag = null;
      }
      else if (sc == '/' && prev == '/' && !tag) tag = '/';
      else if (sc == '\n' && tag == '/') {
        yield {type: 'comment', data: buffer.slice(1).trim() };
        buffer = ''; tag = null;
      }
      else if (sc == '*' && prev == '/' && !tag) tag = '*';
      else if (sc == '/' && prev == '*' && tag == '*') {
        yield {type: 'comment', data: buffer.slice(1,-1).trim() };
        buffer = ''; tag = null;
      }
      else if (tag || !/\s/.test(sc)) buffer += sc;
      prev = sc;
    }
}

export function parse(source, { verbose = false, comments = false }) {
  const result = {}, stack = [result];
  let it = result, key = null;
  for (let cmd of parser(source)) {
    switch (cmd.type) {
      case 'section': {
        stack.push(it);
        it = it[cmd.data] = {};
        break;
      }
      case 'key': key = cmd.data; break;
      case 'value': {
        const value = isNaN(cmd.data) ? cmd.data : new Number(cmd.data);
        if (key in it) console.warn(`${key} will be overwritten`);
        it[key] = value;
        break;
      }
      case 'close': it = stack.pop(); break;
      case 'comment': {
        if (comments) {
          if (!('comments' in result)) result['comments'] = [];
          result['comments'].push(cmd.data);
        }
        break;
      }
      default: break;
    }
  }
  return result;
}

function cli() {

  const options = require('yargs')
    .usage('Usage: $0 file... [options]')
    .option('verbose', {
      alias: 'v',
      default: false,
      boolean: true,
    })
    .option('comments', {
      default: false,
      boolean: true,
      description: 'Collect comments into an array named "comments"',
    })
    .option('pretty-print', {
      alias: ['pp'],
      default: false,
      boolean: true,
    })
    .option('use-filename-as-root', {
      default: 0,
      number: true,
    })
    .demand(1)
    .help('help')
    .argv;

  const files = options._;
  const arr_data = [];
  const obj_data = {};
  for (let file of files) {
    if (options.verbose) console.log(file);
    const source = fs.readFileSync(file, {encoding: 'binary'}).trim();
    const data = parse(source, options);

    if (options.useFilenameAsRoot > 0) {
      const names = [];
      for (let i = 1, p = path.dirname(file);i < options.useFilenameAsRoot;++i) {
        names.unshift( path.basename(p) );
        p = path.dirname(p);
      }
      let node = obj_data;
      for (let name of names) {
        if (!(name in node)) node = node[name] = {}
        else node = node[name];
      }
      const name = path.basename(file, path.extname(file));
      node[name] = data;
    }
    else arr_data.push(data);
  }

  const result = options.useFilenameAsRoot > 0 ? obj_data : arr_data.length > 1 ? arr_data : arr_data[0];
  const json = JSON.stringify(result, null, options.pp ? 2 : 0);
  process.stdout.write(json);

}
