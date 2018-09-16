require("babel-register")({
  presets: ['env', 'react'],
  plugins: ['transform-object-rest-spread', 'transform-runtime']
});

const buildBaseCommand = require('./buildBaseCommand');

const command = buildBaseCommand({
  name: 'start'
})
command();
