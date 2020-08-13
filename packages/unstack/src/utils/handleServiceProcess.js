require("@babel/register")({
  presets: ["@babel/env", "@babel/react"],
  plugins: [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-transform-runtime",
    "@babel/plugin-proposal-class-properties"
  ]
});

const { hashElement } = require("folder-hash");

const handleServiceWithContext = require("../utils/handleServiceWithContext");
const contextStore = require("./contextStore");
const cacheStore = require("./cacheStore");

const serviceFolderIsSame = async serviceName => {
  const cache = cacheStore.read();
  const existingServiceHash = cache.serviceHashes[serviceName];
  const hash = await hashElement(`./${serviceName.split(".").join("/")}`, {});
  const newServiceHash = hash.hash;
  cache.serviceHashes = {
    ...cache.serviceHashes,
    [serviceName]: newServiceHash
  };
  cacheStore.write(cache);
  return newServiceHash == existingServiceHash;
};
let onSourceChanges = {};
process.on("message", async ({ name, info, fullRebuild, command }) => {
  if (command) {
    if (command == "killRequest") {
      process.send({ command: "killResponse", value: true });
    }
    if (command == "sourceChanged") {
      const onSourceChange = onSourceChanges[name];
      if (onSourceChange) {
        console.log(await onSourceChange());
      }
    }
  } else {
    if (name) {
      const context = contextStore.read();
      const shouldRebuild = !(await serviceFolderIsSame(name));
      if (fullRebuild || shouldRebuild) {
        const localState = {};
        const newContext = await handleServiceWithContext(context, localState)(
          info,
          shouldRebuild
        );
        onSourceChanges[name] = localState.onServiceChange;
        contextStore.write(newContext);
      }
      process.send({ command: "done" });
    }
  }
});
