const COMMAND_NAME = "start";
const util = require("util");
const fork = require("child_process").fork;

exports.command = COMMAND_NAME;
exports.desc = "Start a development unstack";
exports.builder = {
  dir: {
    default: "."
  }
};
exports.handler = function(argv) {
  const subprocess = fork("./node_modules/unstack/dist/utils/hotStart.js");
  process.on("exit", function() {
    console.log("killing start subprocess");
    subprocess.kill();
  });
};
