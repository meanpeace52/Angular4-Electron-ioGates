import { CommandRemoveInput, Share } from '../types';
import { Directory } from '../lib/directory';
export function removeCommand(args: CommandRemoveInput, done: Function) {
  const removeFromDir = args.options.remove;
  let executor;
  if (args.options.id) {
    executor = Share.DeleteById(args.options.id);
  }
  if (args.options.dir) {
    executor = Share.DeleteByDir(args.options.dir);
  }
  if (args.options.url) {
    executor = Share.DeleteByUrl(args.options.url);
  }
  return executor
    .then(() => {
      if (!!removeFromDir && args.options.dir) {
        return Directory.delete(args.options.dir);
      }
      return null;
    })
    .then(() => {
      console.log('[remove] command executed successfully.');
    })
    .catch(done);
}