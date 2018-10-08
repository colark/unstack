#!/usr/bin/env node
require("babel-register")({
  presets: ['env', 'react'],
  plugins: ['transform-object-rest-spread', 'transform-runtime']
});

var cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

try {
  require('yargs')
    .commandDir('commands')
    .demandCommand()
    .help()
    .argv
} catch(e) {
  console.log(e.message)
  console.trace();
}
