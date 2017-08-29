import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import * as Type from './lib/types';
import { Sequelize } from 'sequelize-typescript';

const sequelize = new Sequelize({
  name: 'iogates',
  dialect: 'sqlite',
  username: 'root',
  password: '',
  logging: false,
  storage: `${process.cwd()}/iogates.sqlite`
});

sequelize.addModels([Type.File, Type.Share]);
sequelize
  .sync()
  .then(() => {
    console.log('sync done....');
  });

const commands = vorpal();
commands
  .command('download [dir] [url]', 'Download folder from Share URL')
  .option('-m', '--monitor', 'Shows download progress')
  .option('-v', '--verbose', 'Shows debug logs')
  .action(downloadComand);
commands
  .delimiter('iogates>')
  .show()
  .parse(process.argv);
commands.commands = commands.commands;

module.exports = commands;
