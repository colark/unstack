#!/usr/bin/env node
require("@babel/register")({
  presets: ['@babel/env', '@babel/react'],
  plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-transform-runtime', "@babel/plugin-proposal-class-properties"]
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
