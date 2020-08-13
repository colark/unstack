const contextDirectory = "./.unstack/tmp/cache/";
const contextLocation = contextDirectory + "context.json";
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

module.exports = {
  write: rawContext => {
    mkdirp.sync(contextDirectory);
    fs.writeFileSync(contextLocation, JSON.stringify(rawContext), "utf-8");
  },
  read: () => {
    let context;
    try {
      context = JSON.parse(
        fs.readFileSync(contextLocation, { encoding: "utf-8" })
      );
    } catch (_) {
      context = {
        config: {}
      };
    }

    return context;
  }
};
