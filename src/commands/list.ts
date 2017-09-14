import { CommandListInput, Share } from '../types';
import * as Table from 'cli-table';
export function listCommand(args: CommandListInput, done: Function) {
  const entity = args.entity || args.options.entity;
  let fn: Function = listAllShares;
  if(entity === 'file') {
    fn = listAllFiles;
  }
  return global['_DB']
    .sync()
    .then(() => {
      return fn();
    })
    .then(() => {
      return done();
    })
    .catch(done);
}

function listAllShares() {
  return Share.findAll({
    order: [
      ['updated_at', 'DESC']
    ],
    raw: true,
    attributes: ['id', 'dir', 'updated_at']
  })
  .then((shares: Array<Object>) => {
    const table = new Table({
      head: [
        'ID', 'DESTINATION', 'LAST ACTIVITY'
      ],
      colWidths: [6, 55, 40],
      style: {
        head: ['yellow'],
        border: ['white']
      }
    });
    table.push(...Share.ForTableOutput(shares));
    console.log(table.toString());
    // console.log(shares);
  });
}

function listAllFiles() {

}