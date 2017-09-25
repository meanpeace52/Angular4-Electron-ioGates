import { CommandAddInput, Share } from '../types';
import { Directory } from '../lib/directory';
import { IOGates } from '../lib/iogates';

export function addCommand(args: CommandAddInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const ioGate: IOGates = new IOGates();
  const directory = new Directory(destination);
  const logger = global['logger'];
  global['_DB']
    .sync()
    .then(() => {
      return directory.create();
    })
    .then(() => {
      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      ioGate.setApiUrlFromShareUrl(share.url);
      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      share.direction = args.direction.toUpperCase();
      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      logger.info('add share ' + share.id);
    })
    .then(() => {
      return done();
    })
    .catch(done);
}