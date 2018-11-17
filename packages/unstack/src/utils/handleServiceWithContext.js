const util = require("util");
const exec = util.promisify(require("child_process").exec);
const lodash = require("lodash");
const resolveLocalPath = require("./resolveLocalPath");
const HandlerHelper = require("./HandlerHelper").default;

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

  serviceDotName =
    definition.type == "context" ? "context" : location.split("/").join(".");

  outputProgressInfo(`handling with ${definition.handler.name}`);
  return new Promise(async (resolve, reject) => {
    //load handler from package, or locally
    const handlerName = definition.handler.name;
    const shouldInstall = context.command.name == "install";
    const handlerHelper = new HandlerHelper({
      handlerName,
      serviceDotName,
      shouldInstall
    });

    const [handler, handlerLocation] = await handlerHelper.resolveHandler();

    if (handler) {
      outputProgressInfo(`found handler`);
      const component = await handlerHelper.resolveComponent({
        definition,
        location
      });
      //wrap component
      const wrappedComponent = handler.wrapComponent(component, context);

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
        context.services[serviceDotName].outputs = await wrappedComponent[
          context.command.name
        ](commandConfig);

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
