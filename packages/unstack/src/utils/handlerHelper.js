const util = require("util");
const exec = util.promisify(require("child_process").exec);
const installDependenciesForPackage = require("./installDependenciesForPackage")
  .default;
const resolveLocalPath = require("./resolveLocalPath");
const fs = require("fs");

const mergeDependencies = ({
  handlerLocation,
  componentLocation,
  tmpLocation
}) => {
  const handlerPackageJson = JSON.parse(
    fs.readFileSync(handlerLocation + "/package.json", {
      encoding: "utf-8"
    })
  );

  // to get es6 goodness via babel
  // const serviceDependencies = JSON.parse(
  //   fs.readFileSync(handlerLocation + "/service-dependencies.json", {
  //     encoding: "utf-8"
  //   })
  // );

  const componentPackageJson = JSON.parse(
    fs.readFileSync(componentLocation + "/package.json", {
      encoding: "utf-8"
    })
  );

  // merge package.json dependencies in place with handler dependencies
  componentPackageJson.dependencies = Object.assign(
    {},
    handlerPackageJson.dependencies,
    componentPackageJson.dependencies
    //serviceDependencies
  );

  componentPackageJson.name = `${handlerPackageJson.name}.${
    componentPackageJson.name
  }`;

  fs.writeFileSync(
    tmpLocation + "/package.json",
    JSON.stringify(componentPackageJson),
    "utf-8"
  );
};

export default class HandlerHelper {
  constructor({
    handlerName,
    serviceDotName,
    shouldInstall,
    environmentName,
    branchName,
    contextObject,
    handlerLocation,
    componentLocation
  }) {
    this.handlerName = handlerName;
    this.shouldInstall = shouldInstall;
    this.branchName = branchName;
    this.serviceDotName = serviceDotName;
    this.serviceName = serviceDotName;
    this.componentLocation = `${
      process.env.COMPONENT_PATH_PREFIX
        ? process.env.COMPONENT_PATH_PREFIX + "/"
        : ""
    }${componentLocation}`;
    this.environmentName = environmentName;
    this.outputProgressInfo = (...toLog) => {
      console.log(serviceDotName, ": ", ...toLog);
    };
    this.workingDirectory = `./.unstack/tmp/working/${
      contextObject.command.name
    }/${this.serviceName}`;
  }
  buildWorkingDirectory = async () => {
    const workDir = this.workingDirectory;
    const handlerLocation = this.handlerLocation;
    const componentLocation = `./${this.componentLocation}`;
    await exec(`rm -rf ${workDir}`, { cwd: process.cwd() });
    const buildAppFolderCommand = `mkdir -p ${workDir}`;
    const buildAppFolder = await exec(buildAppFolderCommand, {
      cwd: process.cwd()
    });

    await exec(`cp -R ${handlerLocation}/* ${workDir}`, {
      cwd: process.cwd()
    });

    // optional
    // await exec(`cp ${handlerLocation}/.babelrc ${workDir}`, {
    //   cwd: process.cwd()
    // });

    await exec(`cp -rf ${componentLocation}/. ${workDir}/component`, {
      cwd: process.cwd()
    });
  };
  copyFromHandler = () => {};
  copyFromComponent = () => {};
  getComponent = () => this.resolvedComponent;
  getServiceName = () => this.serviceDotName;
  getServiceDescriptor = () => {
    return `${this.serviceName.split(".").join("")}-${
      this.environmentName == "review"
        ? this.branchName.split("-").join("")
        : this.environmentName
    }`
      .replace(/_/, "")
      .replace(/\//g, "")
      .replace(/\$/, "")
      .replace(/@/, "")
      .substring(0, 38);
  };
  mergeDependencies = () => {
    mergeDependencies({
      handlerLocation: this.handlerLocation,
      componentLocation: this.componentLocation,
      tmpLocation: this.workingDirectory
    });
  };
  readFromWorkDir = path => {
    return fs.readFileSync(`${this.workingDirectory}/${path}`, {
      encoding: "utf-8"
    });
  };
  writeToWorkDir = (path, content) => {
    fs.writeFileSync(`${this.workingDirectory}/${path}`, content, "utf-8");
  };
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
    this.handlerLocation = packageLocation;
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
      this.resolvedComponent = component;
      return component;
    }
  };
}
