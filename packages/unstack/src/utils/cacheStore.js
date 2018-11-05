const contextDirectory = "./.unstack/tmp/cache/";
const contextLocation = contextDirectory + "cache.json";
const fs = require("fs");
const mkdirp = require("mkdirp");

module.exports = {
  write: rawContext => {
    if (!fs.existsSync(contextLocation)) {
      mkdirp.sync(contextDirectory);
    }
    fs.writeFileSync(contextLocation, JSON.stringify(rawContext), "utf-8");
    return true;
  },
  read: () => {
    let context;
    try {
      context = JSON.parse(
        fs.readFileSync(contextLocation, { encoding: "utf-8" })
      );
    } catch (e) {
      context = { serviceHashes: {} };
    }
    return context;
  }
};
