import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import { uploadCommand } from './commands/upload';
import * as Type from './lib/types';
import { Sequelize } from 'sequelize-typescript';
import * as CONFIG from '../config';

const sequelize = new Sequelize(CONFIG.database);

sequelize.addModels([Type.Share, Type.File]);
global['_DB'] = sequelize;

const commands = vorpal();
commands
  .command('download [dir] [url]', 'Download folder from Share URL')
  .option('-m, --monitor', 'Shows download progress')
  .option('-v, --verbose', 'Shows debug logs')
  .option('-w, --watch', 'Watch for changes and auto-download')
  .action(downloadComand);

commands
  .command('upload [dir] [url]', 'Upload to Share URL from folder')
  .option('-m', '--monitor', 'Shows upload progress')
  .option('-v', '--verbose', 'Shows debug logs')
  .action(uploadCommand);
commands
  .delimiter('iogates>')
  .show()
  .parse(process.argv);
commands.commands = commands.commands;

module.exports = commands;
