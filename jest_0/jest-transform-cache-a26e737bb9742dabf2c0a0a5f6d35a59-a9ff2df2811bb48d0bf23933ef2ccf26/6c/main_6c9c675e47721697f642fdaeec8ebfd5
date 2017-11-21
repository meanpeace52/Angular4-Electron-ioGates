"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vorpal = require("vorpal");
const download_1 = require("./commands/download");
const commands = vorpal();
commands
    .command('download [dir] [url]', 'Download folder from Share URL')
    .option('-m', '--monitor', 'Shows download progress')
    .action(download_1.downloadComand);
commands
    .delimiter('iogates>')
    .show()
    .parse(process.argv);
commands.commands = commands.commands;
module.exports = commands;
//# sourceMappingURL=main.js.map