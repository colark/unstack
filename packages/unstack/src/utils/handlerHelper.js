const installDependenciesForPackage = require("./installDependenciesForPackage")
  .default;
const resolveLocalPath = require("./resolveLocalPath");

export default class HandlerHelper {
  constructor({ handlerName, serviceDotName, shouldInstall }) {
    this.handlerName = handlerName;
    this.shouldInstall = shouldInstall;
    this.outputProgressInfo = (...toLog) => {
      console.log(serviceDotName, ": ", ...toLog);
    };
  }
  copyFromHandler = () => {};
  copyFromComponent = () => {};
  resolveHandler = async () => {
    const localHandlersLocation = process.env.LOCAL_HANDLERS_PATH
      ? process.env.LOCAL_HANDLERS_PATH
      : "./.unstack/handlers";
    let packageLocation;
    let handler;
    try {
      this.outputProgressInfo(`Attempting to load packaged handler`);
      packageLocation = resolveLocalPath(
        `./node_modules/unstack-${this.handlerName}`
      );
      const success = await installDependenciesForPackage(packageLocation, {
        install: this.shouldInstall
      });
      if (success) {
        handler = require(packageLocation);
      } else {
        throw new Error("no package");
      }
    } catch (err) {
      try {
        this.outputProgressInfo(
          `Attempting to load local handler because ${err.message}`
        );
        packageLocation = resolveLocalPath(
          `${localHandlersLocation}/${this.handlerName}`
        );
        const success = await installDependenciesForPackage(packageLocation, {
          install: this.shouldInstall
        });
        if (success) {
          handler = require(packageLocation);
        }
      } catch (err) {
        throw new Error(err);
      }
    }
    return [handler, packageLocation];
  };
  resolveComponent = async ({ definition, location }) => {
    let componentLocation;
    if (definition.type == "context") {
    } else {
      componentLocation = resolveLocalPath(`./${location}`);
    }

    const success = await installDependenciesForPackage(componentLocation);
    this.outputProgressInfo(
      `Component dependencies installed ${
        success ? "successfully" : "unsuccessfully"
      }.`
    );
    if (success || !componentLocation) {
      const component = componentLocation
        ? await require(componentLocation).default
        : {};
      this.outputProgressInfo(`LOADED COMPONENT`);
      return component;
    }
  };
}
