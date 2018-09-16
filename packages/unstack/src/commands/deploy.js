const buildBaseCommand = require('../utils/buildBaseCommand');

const COMMAND_NAME = 'deploy'

exports.command = `${COMMAND_NAME} [development]`
exports.desc = 'Deploy an unstack'
exports.builder = {
  dir: {
    default: '.'
  }
}
exports.handler = function (argv) {
  const command = buildBaseCommand({
    name: COMMAND_NAME,
    environment: (argv.environment && argv.environment.length > 0) ? argv.environment : 'development',
    options: {
      branch: argv.b
    }
  })

  command();
}
