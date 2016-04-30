namespace fbi {

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const mkdirp = require('mkdirp');

const default_options = {
  verbose: false,
};

let options = default_options;

const args = require('yargs')
  .usage('$0 in [args]')
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    default: default_options.verbose,
  })
  .demand(1)
  .help('help')
  .argv;

for (let file of args._) {
  let str = fs.readFileSync(file, {encoding: 'utf8'}).trim();

  parse_section(str);




}

function parse_section(source: string) {
  const head = parse_head(source);
  console.log(head);
  const body = parse_body(head.next);

}

function parse_head(s: string) {
  let i = 0;
  const l = s.length;
  if (s[0] != '[') return null;
  for (i = 1;s[i] != ']';++i);
  return { title: s.slice(1, i).trim(), next: s.slice(i+1).trim() };
}

function parse_body(s: string) {
  if (s[0] != '{') return null;
  const body = {};
  let name = null;
  for (let i = 1, f = 1; i < s.length && s[i] != ']';++i) {
    if (s[i] == '=') {
      name = s.slice(f, i).trim();
      f = i + 1;
    }
    else if (s[i] == ';') {
      body[name] = s.slice(f, i).trim();
      f = i + 1;
      name = null;
    }
  }
  return body;
}

}
