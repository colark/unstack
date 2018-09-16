const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lodash = require('lodash');

const collectServices = require('../utils/collectServices');
const handleServiceWithContext = require('../utils/handleServiceWithContext');
const resolveLocalPath = require('../utils/resolveLocalPath');


const fs = require("fs");
const yaml = require('js-yaml');

const readUnstack = (name) => yaml.safeLoad(fs.readFileSync(
  resolveLocalPath(`./.unstack/${name}.yml`),
  { encoding: 'utf-8' }
));

module.exports = ({ name, environment, options = {} }) => async () => {
  // read config
  const config = readUnstack('config');
  const serviceManifest = readUnstack('services');
  // unnest service definitions
  const services = collectServices(serviceManifest);

  // build initial context object.
  const context = {
    command: {
      name
    },
    environment: {
      name: environment,
    },
    branch: {},
    services: {}
  };
  if (options.branch) {
    context.branch = {
      name: options.branch
    };
  };
  //iterate through services and load handler and component
  const handleService = handleServiceWithContext(context);
  const contextService = services.find(({ definition }) => definition.type == "context");
  if (contextService) {
    await handleService(contextService);
  }
  const nonContextServices = services.filter(({ definition }) => definition.type != "context");

  const servicesByDependency = nonContextServices.sort((left, right) => {
    const toDotName = service => right.location.split('/').join(".")
    if (left.depends_on && left.depends_on.indexOf(toDotName(right)) != -1) {
      return -1;
    } else {
      return 1;
    }
  })
  console.log("services:", ...servicesByDependency)
  // iterate through services in sync
  for (var i = 0; i < servicesByDependency.length; i++) {
    await handleService(servicesByDependency[i]);
  };
}
