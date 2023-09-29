const {
  run
} = require('runjs');
const chalk = require('chalk');
const replace = require('replace-in-file');
const path = require('path');
const config = require('../vue.config.js');

const rawArgv = process.argv.slice(2);
const args = rawArgv.join(' ');

const {
  WEB_PORT = 9528, WEB_BASE_API = 'http://127.0.0.1:9319', WEB_WS_HOST = 'ws://127.0.0.1:9319'
} = process.env;

function replaceEnv() {
  try {
    console.log(`Env: WEB_PORT: ${WEB_PORT}, WEB_BASE_API: ${WEB_BASE_API}, WEB_WS_HOST: ${WEB_WS_HOST}`);

    const results = replace.sync({
      files: path.resolve(__dirname, '../dist/static/js/app.*.js'),
      processor: (input) => input.replace(/"ENV_VUE_APP_PORT"/g, WEB_PORT).replace(/ENV_VUE_APP_BASE_API/g, WEB_BASE_API).replace(/ENV_VUE_APP_WS_HOST/g, WEB_WS_HOST),
    });
    console.log('Replacement results:', results);
  } catch (error) {
    console.error('Replacement error occurred:', error);
  }
}

function startServer(port = 9526) {
  const report = rawArgv.includes('--report');
  const publicPath = config.publicPath;

  var connect = require('connect');
  var serveStatic = require('serve-static');
  const app = connect();

  app.use(
    publicPath,
    serveStatic(path.resolve(__dirname, '../dist/'), {
      index: ['index.html', '/']
    })
  );

  app.listen(port, function() {
    console.log(chalk.green(`> Preview at  http://localhost:${port}${publicPath}`));
    if (report) {
      console.log(chalk.green(`> Report at  http://localhost:${port}${publicPath}report.html`));
    }
  });
}

if (process.env.npm_config_preview || rawArgv.includes('--preview')) {
  run(`vue-cli-service build ${args}`);

  startServer(9526);
} else if (process.env.npm_config_production || rawArgv.includes('--production')) {
  startServer(9528);
} else if (process.env.npm_config_production || rawArgv.includes('--env')) {
  replaceEnv();
  startServer(9528);
} else {
  run(`vue-cli-service build ${args}`);
}
