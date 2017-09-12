import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import { uploadCommand } from './commands/upload';
import * as Type from './lib/types';
import { Sequelize } from 'sequelize-typescript';
import * as winston from 'winston';
import * as CONFIG from '../config';

// setup db and copy to global
const sequelize = new Sequelize(CONFIG.database);
sequelize.addModels([Type.Share, Type.File]);
global['_DB'] = sequelize;

// setup logger and copy to global.
let transports: any = [
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
  ]
}
const logger = new winston.Logger({
  transports: transports,
  exitOnError: true
});
global['logger'] = logger;

const commands = vorpal();
commands
  .command('download [dir] [url]', 'Download folder from Share URL')
  .option('-m, --monitor', 'Shows download progress')
  .option('-v, --verbose', 'Shows debug logs')
  .option('-w, --watch', 'Watch for changes and auto-download')
  .action(downloadComand);

commands
  .command('upload [dir] [url]', 'Upload to Share URL from folder')
  .option('-m, --monitor', 'Shows upload progress')
  .option('-v, --verbose', 'Shows debug logs')
  .option('-w, --watch', 'Watch for changes and auto-upload')
  .option('--delete', 'Delete file after successful upload')
  .option('--delay <delay>', 'Delay between directory scans')
  .action(uploadCommand);

commands
  .delimiter('iogates>')
  .show()
  .parse(process.argv);

commands.commands = commands.commands;

module.exports = commands;
