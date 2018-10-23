require("@babel/register")({
  presets: ['@babel/env', '@babel/react'],
  plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-transform-runtime', "@babel/plugin-proposal-class-properties"]
});

try {
  const buildBaseCommand = require('./buildBaseCommand');

  const command = buildBaseCommand({
    name: 'start'
  })

  command();
} catch(e) {
  console.log(e.message)
}
