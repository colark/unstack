const util = require("util");
const exec = util.promisify(require("child_process").exec);
const lodash = require("lodash");
const path = require("path");
const fs = require("fs");

const installDependenciesForPackage = async (
  packageLocation,
  install = false
) => {
  return new Promise(async (resolve, reject) => {
    let packageJson;
    try {
      packageJson = JSON.parse(
        fs.readFileSync(packageLocation + "/package.json", {
          encoding: "utf-8"
        })
      );
    } catch (err) {
      resolve(false);
      return false;
    }

    if (install) {
      const dependencyStrings = lodash.map(
        packageJson.dependencies,
        (version, name) => `${name}@${version}`
      );
      //switch back to custom logger
      console.log(`installing ${dependencyStrings.join(" ")}`);
      const installCommand = `npm install --save-dev ${dependencyStrings.join(
        " "
      )}`;

      await exec(installCommand, { cwd: process.cwd() });
    }
    resolve(true);
  });
};

export default installDependenciesForPackage;
