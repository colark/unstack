const util = require("util");
const exec = util.promisify(require("child_process").exec);
const lodash = require("lodash");
const path = require("path");
const fs = require("fs");
const resolveLocalPath = require("./resolveLocalPath");

const handleServiceWithContext = context => async (
  { definition, location },
  shouldRebuild
) => {
  let serviceDotName;

  const outputProgressInfo = (...toLog) => {
    console.log(serviceDotName, ": ", ...toLog);
  };

  const mergeServiceContext = serviceContext => {
    if (definition.type == "context") {
      context = Object.assign(context, serviceContext);
    } else {
      const existingContext = context.services[serviceDotName];
      context.services[serviceDotName] = {
        ...existingContext,
        ...serviceContext
      };
    }
  };

  const installDependenciesForPackage = async packageLocation => {
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

      if (context.command.name == "install") {
        const dependencyStrings = lodash.map(
          packageJson.dependencies,
          (version, name) => `${name}@${version}`
        );
        outputProgressInfo(`installing ${dependencyStrings.join(" ")}`);
        const installCommand = `npm install --save-dev ${dependencyStrings.join(
          " "
        )}`;

        await exec(installCommand, { cwd: process.cwd() });
      }
      resolve(true);
    });
  };

  serviceDotName =
    definition.type == "context" ? "context" : location.split("/").join(".");

  outputProgressInfo(`handling with ${definition.handler.name}`);
  return new Promise(async (resolve, reject) => {
    //load handler from package, or locally
    const handlerName = definition.handler.name;
    let handler;
    let packageLocation;
    try {
      outputProgressInfo(`Attempting to load packaged handler`);
      packageLocation = resolveLocalPath(
        `./node_modules/unstack-${handlerName}`
      );
      const success = await installDependenciesForPackage(packageLocation);
      if (success) {
        handler = require(packageLocation);
      } else {
        throw new Error("no package");
      }
    } catch (err) {
      try {
        outputProgressInfo(
          `Attempting to load local handler because ${err.message}`
        );
        packageLocation = resolveLocalPath(
          `./.unstack/handlers/${handlerName}`
        );
        const success = await installDependenciesForPackage(packageLocation);
        if (success) {
          handler = require(packageLocation);
        }
      } catch (err) {
        throw new Error(err);
      }
    }

    if (handler) {
      outputProgressInfo(`found handler`);
      let componentLocation;
      if (definition.type == "context") {
      } else {
        componentLocation = resolveLocalPath(`./${location}`);
      }

      const success = await installDependenciesForPackage(componentLocation);
      outputProgressInfo(
        `Component dependencies installed ${
          success ? "successfully" : "unsuccessfully"
        }.`
      );
      if (success || !componentLocation) {
        try {
          handler = require(packageLocation);
          const component = componentLocation
            ? await require(componentLocation).default
            : {};
          outputProgressInfo(`LOADED COMPONENT`);
          //wrap component
          const wrappedComponent = handler.wrapComponent(component, context);

          const commandConfig = {
            service: {
              name: serviceDotName,
              location: location
            },
            handler: {
              name: handlerName,
              location: packageLocation
            },
            shouldRebuild
          };

          if (wrappedComponent.provideContext) {
            const serviceContext = await wrappedComponent.provideContext(
              commandConfig
            );
            mergeServiceContext(serviceContext);
          }

          if (wrappedComponent[context.command.name]) {
            outputProgressInfo(`running handler defined command`);
            if (!context.services[serviceDotName]) {
              context.services[serviceDotName] = {};
            }
            context.services[serviceDotName].outputs = await wrappedComponent[
              context.command.name
            ](commandConfig);

            const outputs = context.services[serviceDotName].outputs || {};
            // print Outputs
            const outputKeys = Object.keys(outputs);
            if (outputKeys.length) {
              outputProgressInfo(`**** Outputs ****`);
              outputKeys.forEach(key =>
                outputProgressInfo(key, ":", outputs[key])
              );
            }
          }
          resolve(context);
        } catch (e) {
          console.log(e);
          console.trace();
        }
      }
    }
  }).catch(e => {
    console.trace();
  });
};

module.exports = handleServiceWithContext;
