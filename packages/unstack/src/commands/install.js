const buildBaseCommand = require("../utils/buildBaseCommand");

const COMMAND_NAME = "install";

exports.command = COMMAND_NAME;
exports.desc = "Install dependencies for an unstack";
exports.builder = {
  dir: {
    default: "."
  }
};
exports.handler = function(argv) {
  const command = buildBaseCommand({
    name: COMMAND_NAME
  });
  command();
};
