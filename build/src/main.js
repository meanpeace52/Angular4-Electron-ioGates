"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vorpal = require("vorpal");
const download_1 = require("./commands/download");
const upload_1 = require("./commands/upload");
const list_1 = require("./commands/list");
const add_1 = require("./commands/add");
const Type = require("./lib/types");
const sequelize_typescript_1 = require("sequelize-typescript");
const winston = require("winston");
const node_machine_id_1 = require("node-machine-id");
const CONFIG = require("../config");
const sequelize = new sequelize_typescript_1.Sequelize(CONFIG.database);
sequelize.addModels([Type.Share, Type.File]);
global['_DB'] = sequelize;
let transports = [
    new (winston.transports.Console)({
        name: 'console'
    }),
];
if (CONFIG.logs.devMode === false) {
    transports = [
        new (winston.transports.File)({
            name: 'info-file',
            filename: CONFIG.logs.info,
            level: 'info',
            json: false
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: CONFIG.logs.error,
            level: 'error',
            json: false
        })
    ];
}
const logger = new winston.Logger({
    transports: transports,
    exitOnError: true
});
global['logger'] = logger;
global['device-id'] = node_machine_id_1.machineIdSync();
const commands = vorpal();
commands
    .command('download [dir] [url]', 'Download folder from Share URL')
    .option('-m, --monitor', 'Shows download progress')
    .option('-v, --verbose', 'Shows debug logs')
    .option('-w, --watch', 'Watch for changes and auto-download')
    .action(download_1.downloadComand);
commands
    .command('upload [dir] [url]', 'Upload to Share URL from folder')
    .option('-m, --monitor', 'Shows upload progress')
    .option('-v, --verbose', 'Shows debug logs')
    .option('-w, --watch', 'Watch for changes and auto-upload')
    .option('--delete', 'Delete file after successful upload')
    .option('--delay <delay>', 'Delay between directory scans')
    .action(upload_1.uploadCommand);
commands
    .command('add [direction] [dir] [url]', 'Adds a share in registry')
    .option('-d --delete', 'Delete the local file if direction is upload')
    .action(add_1.addCommand);
commands
    .command('list [entity]', 'List (share|files) on local storage')
    .option('-e, --entity <entity>', 'Entity to list down')
    .action(list_1.listCommand);
commands
    .delimiter('iogates>')
    .show()
    .parse(process.argv);
commands.commands = commands.commands;
module.exports = commands;
//# sourceMappingURL=main.js.map