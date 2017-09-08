import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
import { uploadCommand } from './commands/upload';
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

sequelize.sync().then(() => {
  global['_DB'] = sequelize;
  
  const commands = vorpal();
  commands
    .command('download [dir] [url]', 'Download folder from Share URL')
    .option('-m', '--monitor', 'Shows download progress')
    .option('-v', '--verbose', 'Shows debug logs')
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
}).error((error) => {
  console.log(error);
});
