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
  storage: `${process.cwd()}/iogates.sqlite`,
  pool: {
    max: 1
  }
});


sequelize.addModels([Type.File, Type.Share]);

async function syncDatabase() {
  await sequelize.sync();
  return true;
}
syncDatabase();
global['_DB'] = sequelize;

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
