const buildBaseCommand = require('../utils/buildBaseCommand');

const COMMAND_NAME = 'test'

exports.command = COMMAND_NAME
exports.desc = 'Run tests for an unstack'
exports.builder = {
  dir: {
    default: '.'
  }
}
exports.handler = function (argv) {
  const command = buildBaseCommand({
    name: COMMAND_NAME
  })
  command();
}
