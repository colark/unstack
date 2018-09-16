const COMMAND_NAME = 'start'
const util = require('util');
const exec = require('child_process').exec;

exports.command = COMMAND_NAME
exports.desc = 'Start a development unstack'
exports.builder = {
  dir: {
    default: '.'
  }
}
exports.handler = function (argv) {
  const subprocess = exec('npx nodemon ./node_modules/unstack/dist/utils/hotStart.js');
  process.on('exit', function() {
    console.log('killing start subprocess');
    subprocess.kill()
  });
  subprocess.stdout.pipe(process.stdout)
  subprocess.stderr.pipe(process.stderr)
}
