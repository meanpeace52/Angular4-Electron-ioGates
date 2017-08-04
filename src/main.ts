import * as vorpal from 'vorpal';
import { downloadComand } from './commands/download';
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
