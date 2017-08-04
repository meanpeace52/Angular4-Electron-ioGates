"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vorpal = require("vorpal");
const download_1 = require("./commands/download");
const commands = vorpal();
commands
    .command('download [url...]', 'Download folder from Share URL')
    .option('-o', '--output <dir>', 'Destination to download files')
    .option('-m', '--monitor', 'Shows download progress')
    .action(download_1.downloadComand);
commands
    .delimiter('iogates>')
    .show()
    .parse(process.argv);
module.exports = vorpal;
//# sourceMappingURL=main.js.map