'use strict';

const proxyApp = require('./ai-proxy/app');

module.exports = proxyApp;

if (require.main === module) {
  proxyApp.startServer();
}
