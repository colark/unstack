const util = require("util");
const exec = util.promisify(require("child_process").exec);

const wrapComponent = () => {
  return {
    provideContext: async () => {
      return new Promise(async (resolve, reject) => {
        const secrets = { hello: "hi" };

        resolve({
          secrets
        });
      });
    }
  };
};

module.exports = {
  wrapComponent
};
