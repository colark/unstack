const util = require("util");
const exec = util.promisify(require("child_process").exec);
const installDependenciesForPackage = require("../installDependenciesForPackage")
  .default;
const resolveLocalPath = require("../resolveLocalPath");
const fs = require("fs");

const isImplicitService = require("./methods/isImplicitService");
const makeBuilderHelper = require("../builderHelper");

const buildSelfHandler = (localCommands = {}) => ({
  wrapComponent: () => {
    const handlerObject = {};
    const commandTuples = Object.keys(localCommands).map(commandName => [
      commandName,
      localCommands[commandName]
    ]);
    for (const [name, command] of commandTuples) {
      handlerObject[name] = async () => {
        const { stdout, stderr } = await exec(command);
        console.log(stdout, stderr);
      };
    }
    return handlerObject;
  }
});

const mergeDependencies = ({
  handlerLocation,
  componentLocation,
  tmpLocation
}) => {
  const handlerPackageJson = handlerLocation
    ? JSON.parse(
        fs.readFileSync(handlerLocation + "/package.json", {
          encoding: "utf-8"
        })
      )
    : {};

  const serviceDependencies = JSON.parse(
    fs.readFileSync(handlerLocation + "/service-dependencies.json", {
      encoding: "utf-8"
    })
  );

  const componentPackageJson = JSON.parse(
    fs.readFileSync(componentLocation + "/package.json", {
      encoding: "utf-8"
    })
  );

  // merge package.json dependencies in place with handler dependencies
  componentPackageJson.dependencies = Object.assign(
    {},
    handlerPackageJson.dependencies,
    componentPackageJson.dependencies,
    serviceDependencies
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
    componentLocation,
    fullContext,
    shouldRebuild,
    runtime
  }) {
    this.fullContext = fullContext;
    this.handlerName = handlerName;
    this.shouldInstall = shouldInstall;
    this.branchName = branchName;
    this.serviceDotName = serviceDotName;
    this.serviceName = serviceDotName;
    this.shouldRebuild = shouldRebuild;
    this.runtime = runtime;
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
    this.builderHelper = makeBuilderHelper();
  }
  buildWorkingDirectory = async () => {
    const workDir = this.workingDirectory;
    const handlerLocation = this.handlerLocation;
    const componentLocation = `./${this.componentLocation}`;

    if (this.shouldRebuild) {
      await exec(`rm -rf ${workDir}`, { cwd: process.cwd() });
    }

    const buildAppFolderCommand = `mkdir -p ${workDir}`;
    const buildAppFolder = await exec(buildAppFolderCommand, {
      cwd: process.cwd()
    });

    if (handlerLocation) {
      await exec(`cp -R ${handlerLocation}/* ${workDir}`, {
        cwd: process.cwd()
      });
    }

    // optional
    // await exec(`cp ${handlerLocation}/.babelrc ${workDir}`, {
    //   cwd: process.cwd()
    // });

    await exec(`cp -rf ${componentLocation}/. ${workDir}/component`, {
      cwd: process.cwd()
    });
  };
  getContext = () => Object.assign({}, this.fullContext);
  isImplicitService = definition =>
    isImplicitService(this.handlerName, definition);
  copyFromHandler = () => {};
  copyFromComponent = () => {};
  copyToLocalDirectory = async ({ from, to }) => {
    await exec(`cp -R ${from} ${this.workingDirectory}/${to}`, {
      cwd: process.cwd()
    });
  };
  getBuilders = () => this.builderHelper.collectBuilders();
  getRuntime = () => this.runtime;
  getComponent = () => this.resolvedComponent;
  getServiceName = () => this.serviceDotName;
  getWorkingDirectoryPath = () => this.workingDirectory;
  getHandlerLocation = () => this.handlerLocation;
  getComponentLocation = () => this.componentLocation;
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
  makeLocalDirectory = async path => {
    const buildGeneratedFolderCommand = `mkdir -p ${
      this.workingDirectory
    }/${path}`;
    await exec(buildGeneratedFolderCommand, {
      cwd: process.cwd()
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
  resolveHandler = async ({ definition }) => {
    let packageLocation;
    let handler;
    const isSelfHandler = this.handlerName == "self";
    if (!isSelfHandler) {
      const localHandlersLocation = process.env.LOCAL_HANDLERS_PATH
        ? process.env.LOCAL_HANDLERS_PATH
        : "./.unstack/handlers";
      try {
        this.outputProgressInfo(`Attempting to load packaged handler`);
        packageLocation = resolveLocalPath(
          `./node_modules/unstack-${this.handlerName}`
        );
        const success = await installDependenciesForPackage(
          packageLocation,
          this.shouldInstall
        );
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
          const success = await installDependenciesForPackage(
            packageLocation,
            this.shouldInstall
          );
          if (success) {
            handler = require(packageLocation);
          }
        } catch (err) {
          throw new Error(err);
        }
      }
    }
    if (isSelfHandler) {
      handler = buildSelfHandler(definition.commands);
    }
    this.handlerLocation = packageLocation;
    return [handler, packageLocation];
  };
  resolveComponent = async ({ definition, location }) => {
    if (!this.isImplicitService(definition)) {
      const componentLocation = resolveLocalPath(`./${location}`);
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
    } else {
      this.resolvedComponent = {};
      return this.resolvedComponent;
    }
  };
}
