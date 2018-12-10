const collectServices = (serviceDefinitions, parent = "") => {
  let services = [];
  for (const serviceName in serviceDefinitions) {
    const definition = serviceDefinitions[serviceName];
    if (definition.handler) {
      let location;
      if (definition.type && definition.type == "context") {
      } else {
        location = `${parent}/${serviceName}`;
      }
      services.push({ definition, location });
    } else if (definition.commands) {
      location = `${parent}/${serviceName}`;
      definition.handler = { name: "self" };
      services.push({ definition, location });
    } else {
      services = services.concat(collectServices(definition, serviceName));
    }
  }
  return services;
};

module.exports = collectServices;
