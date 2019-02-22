const resolveLocalPath = require("../resolveLocalPath");

const makeBuilderHelper = () => {
  return {
    collectBuilders: () => {
      // use just babel builder for now
      try {
        return [require(resolveLocalPath("./.unstack/builders/babel")).default];
      } catch (e) {
        console.log(e);
        return [];
      }
    }
  };
};

module.exports = makeBuilderHelper;
