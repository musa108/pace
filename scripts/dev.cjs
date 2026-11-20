// Electron must not inherit this flag from Node-oriented parent environments.
delete process.env.ELECTRON_RUN_AS_NODE
require('../node_modules/electron-vite/bin/electron-vite.js')
