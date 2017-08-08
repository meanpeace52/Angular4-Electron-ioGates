import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import { File } from './types/models/file';
import { Share } from './types/models/share';
import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
  name: 'iogates',
  dialect: 'sqlite',
  username: 'root',
  password: '',
  storage: `${__dirname}/iogates.sqlite`
});

sequelize.addModels([File, Share]);

const commands = vorpal();
commands
  .command('download [dir] [url]', 'Download folder from Share URL')
  .option('-m', '--monitor', 'Shows download progress')
  .action(downloadComand);
commands
  .delimiter('iogates>')
  .show()
  .parse(process.argv);
commands.commands = commands.commands;

module.exports = commands;
