const util = require("util");
const exec = util.promisify(require("child_process").exec);
const lodash = require("lodash");
const resolveLocalPath = require("./resolveLocalPath");
const HandlerHelper = require("./handlerHelper").default;

const handleServiceWithContext = context => async (
  { definition, location },
  shouldRebuild
) => {
  let serviceDotName;

  const outputProgressInfo = (...toLog) => {
    console.log(`${serviceDotName}#${context.command.name}`, ": ", ...toLog);
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

  serviceDotName =
    definition.type == "context" ? "context" : location.split("/").join(".");

  outputProgressInfo(`handling with ${definition.handler.name}`);
  return new Promise(async (resolve, reject) => {
    //load handler from package, or locally
    const handlerName = definition.handler.name;
    const serviceType = definition.type;
    const shouldInstall = context.command.name == "install";

    const providerName = context.config.targets[serviceType];

    const runtime = providerName
      ? require(resolveLocalPath(
          `./.unstack/providers/${providerName}/runtimes/${serviceType}`
        ))
      : null;

    const handlerHelper = new HandlerHelper({
      handlerName,
      serviceDotName,
      shouldInstall,
      environmentName: context.environment.name,
      branchName: context.branch.name,
      contextObject: context,
      componentLocation: location,
      fullContext: context,
      shouldRebuild,
      runtime
    });

    const [handler, handlerLocation] = await handlerHelper.resolveHandler({
      definition
    });

    if (handler) {
      outputProgressInfo(`found handler`);
      const component = await handlerHelper.resolveComponent({
        definition,
        location
      });
      console.log(definition);
      // only run on "explicit" services, so not context, or self
      if (!handlerHelper.isImplicitService(definition)) {
        await handlerHelper.buildWorkingDirectory();
        handlerHelper.mergeDependencies();
      }

      // wrap component
      const wrappedComponent = handler.wrapComponent(handlerHelper);

      const commandConfig = {
        service: {
          name: serviceDotName,
          location: location
        },
        handler: {
          name: handlerName,
          location: handlerLocation
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
        if (context.command.name == "deploy") {
          console.log(
            `starting deploy for service:${serviceDotName} for env:${
              context.environment.name
            } on branch:${context.branch.name}`
          );
        }

        try {
          context.services[serviceDotName].outputs = await wrappedComponent[
            context.command.name
          ](commandConfig);
        } catch (e) {
          console.log(e);
          throw new Error(e);
        }

        const outputs = context.services[serviceDotName].outputs || {};
        // print Outputs
        const outputKeys = Object.keys(outputs);
        if (outputKeys.length) {
          outputProgressInfo(`**** Outputs ****`);
          outputKeys.forEach(key => outputProgressInfo(key, ":", outputs[key]));
        }
      }
      resolve(context);
    }
    reject("no handler found");
  });
};

module.exports = handleServiceWithContext;
