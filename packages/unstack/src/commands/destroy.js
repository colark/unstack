const buildBaseCommand = require("../utils/buildBaseCommand");

const COMMAND_NAME = "destroy";

exports.command = `${COMMAND_NAME} [development]`;
exports.desc = "Destroy an unstack for a given environment";
exports.builder = {
  dir: {
    default: "."
  }
};
exports.handler = function(argv) {
  const command = buildBaseCommand({
    name: COMMAND_NAME,
    environment:
      argv.environment && argv.environment.length > 0
        ? argv.environment
        : "development",
    options: {
      branch: argv.b,
      only: argv.only ? argv.only.split(",") : []
    }
  });

  command();
};
