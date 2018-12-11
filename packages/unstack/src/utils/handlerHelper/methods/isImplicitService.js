module.exports = (handlerName, definition) => {
  return handlerName == "self" || definition.type == "context";
};
