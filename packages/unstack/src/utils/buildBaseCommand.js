const util = require('util');
const exec = util.promisify(require('child_process').exec);
const lodash = require('lodash');
const fork = require('child_process').fork;

const collectServices = require('../utils/collectServices');
const handleServiceWithContext = require('../utils/handleServiceWithContext');
const resolveLocalPath = require('../utils/resolveLocalPath');

const fs = require("fs");
const yaml = require('js-yaml');
const chokidar = require('chokidar');

const contextStore = require('./contextStore');

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

  const toDotName = service => service.location.split('/').join(".")

  //iterate through services and load handler and component
  const handleService = handleServiceWithContext(context);
  const contextService = services.find(({ definition }) => definition.type == "context");
  if (contextService) {
      await handleService(contextService);
  }
  let nonContextServices = services.filter(({ definition }) => definition.type != "context");
  console.log(options.only);
  if (options.only && options.only.length > 0) {
    nonContextServices = nonContextServices.filter((service) => options.only.indexOf(toDotName(service)) != -1)
  }

  const servicesByDependency = nonContextServices.sort((left, right) => {
    if (left.depends_on && left.depends_on.indexOf(toDotName(right)) != -1) {
      return -1;
    } else {
      return 1;
    }
  }).reverse();
  // iterate through services in sync

  contextStore.write(context);
  const remainingServices = new Set(servicesByDependency.map(info => info.location.split('/').join(".")));
  const inProgressServices = new Set();

  const servicesObject = servicesByDependency.reduce((result, service) => {
    result[service.location.split('/').join(".")] = service;
    return result;
  }, {});

  const threadParameters = [];
  const threadOptions = {
    stdio: [ "inherit", "inherit", "inherit", "ipc" ],
    silent: true
  };

  const serviceThreads = [];
  const watchedServices = new Set();

  const tempThreads = {};
  const enableWatcher = (dotName, currentThread) => {
    tempThreads[dotName] = currentThread;
    if (!watchedServices.has(dotName)) {
      chokidar.watch(dotName.split('.').join("/"), {ignored: /(^|[\/\\])\../}).on('change', (path) => {
        const thread = tempThreads[dotName];
        thread.on('exit', function() {
          const newThread = fork('./node_modules/unstack/dist/utils/handleServiceProcess', threadParameters, threadOptions);
          tempThreads[dotName] = newThread;
          newThread.send({name: dotName, info: servicesObject[dotName], fullRebuild: false});
          newThread.on('message', message => {
            if (message.command == 'done') {
              enableWatcher(dotName, newThread)
            }
          });
        })
        thread.kill();
      });
      watchedServices.add(dotName);
    }
  }

  const pollForCompletion = () => {
    return new Promise(async (resolve, reject) => {
      remainingServices.forEach(dotName => {
        const serviceInfo = servicesObject[dotName];

        const dependencies = serviceInfo.definition.depends_on;

        const hasDependencies = dependencies && dependencies.length > 0;

        const dependenciesFinished = hasDependencies && dependencies.reduce(
          (_, dependencyName) => {
            return !remainingServices.has(dependencyName) ? true : false
          }, true
        );

        if ((dependenciesFinished || !hasDependencies) && !inProgressServices.has(dotName)) {
          inProgressServices.add(dotName);
          console.log(`STARTING ${dotName} BUILD`)
          const thread = fork('./node_modules/unstack/dist/utils/handleServiceProcess', threadParameters, threadOptions);
          thread.on('message', message => {
            if (message.command == 'done') {
              remainingServices.delete(dotName) && inProgressServices.delete(dotName)
              context.command.name == "start" ? enableWatcher(dotName, thread) : thread.kill();
            }
          });
          thread.send({name: dotName, info: serviceInfo, fullRebuild: true});
          serviceThreads.push(thread);
        }
      })
      if (remainingServices.size > 0) {
        setTimeout(async () => {
          await pollForCompletion();
        }, 1000)
      };
      resolve();
    }).catch((e) => console.log(e))

  }
  await pollForCompletion();
}
