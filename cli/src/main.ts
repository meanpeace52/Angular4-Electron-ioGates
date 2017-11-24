import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import { uploadCommand } from './commands/upload';
import { listCommand } from './commands/list';
import { removeCommand } from './commands/remove';
import { addCommand } from './commands/add';
import * as winston from 'winston';
import { machineIdSync } from 'node-machine-id';
import * as CONFIG from '../config';
import * as path from 'path';
import * as fs from 'fs';
import {Database} from 'iotransfer-core';

// setup db and copy to global
const db = new Database(CONFIG.database);
global['_DB'] = db.getDatabase();

// setup logger and copy to global.
let transports: any = [
  new (winston.transports.Console)({
    name: 'console'
  })
];
if (!fs.existsSync(path.dirname(CONFIG.logs.info))) {
  fs.mkdirSync(path.dirname(CONFIG.logs.info));
}
if (!fs.existsSync(path.dirname(CONFIG.logs.error))) {
  fs.mkdirSync(path.dirname(CONFIG.logs.error));
}
if (CONFIG.logs.devMode === false) {
  transports = [
    new (winston.transports.File)({
      name: 'info-file',
      filename: CONFIG.logs.info,
      level: 'debug',
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
global['device-id'] = machineIdSync();
global['config'] = CONFIG;

const commands = vorpal();
commands
  .command('download [dir] [url]', 'Download folder from Share URL')
  .option('-m, --monitor', 'Shows download progress')
  .option('-v, --verbose', 'Shows debug logs')
  .option('-w, --watch', 'Watch for changes and auto-download')
  .option('--startdate <date>', 'Only download files newer than the start date (ISO 8601)')
  .action(downloadComand);

commands
  .command('upload [dir] [url]', 'Upload to Share URL from folder')
  .option('-m, --monitor', 'Shows upload progress')
  .option('-v, --verbose', 'Shows debug logs')
  .option('-w, --watch', 'Watch for changes and auto-upload')
  .option('--thread', 'Allocate number of threads for uploading')
  .option('--delete', 'Delete file after successful upload')
  .option('--delay <delay>', 'Delay between directory scans')
  .option('--chunksize <bytes>', 'Chunk size in bytes')
  .action(uploadCommand);

commands
  .command('remove', 'List (share|files) on local storage')
  .option('-d, --dir <dir>', 'Share directory to delete')
  .option('-u, --url <url>', 'Share url to delete')
  .option('-id, --id <share_id>', 'Share ID to delete')
  .option('-r, --remove', 'If remove files from disk too <true|false>')
  .action(removeCommand);

commands
  .command('add [direction] [dir] [url]', 'Adds a share in registry')
  .option('-d --delete', 'Delete the local file if direction is upload')
  .action(addCommand);

commands
  .command('list [entity]', 'List (share|files) on local storage')
  .option('-e, --entity <entity>', 'Entity to list down')
  .action(listCommand);

commands
  .delimiter('iogates>')
  .show()
  .parse(process.argv);

commands.commands = commands.commands;

module.exports = commands;
