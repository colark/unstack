const path = require("path");

const resolveLocalPath = localPath => path.resolve(process.cwd(), localPath);

module.exports = resolveLocalPath;
