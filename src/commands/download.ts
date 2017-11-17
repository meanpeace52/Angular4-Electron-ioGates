import {
  CommandDownloadInput,
  Files,
  UploadResponse,
  Share,
  File
} from '../lib/types';
import { IOGates } from '../lib/iogates';
import { Downloader } from '../lib/downloader';
import { Directory } from '../lib/directory';
import { DownloadWatcher } from '../lib/watcher';
import * as path from 'path';

// import debug from 'debug';
// const log = debug('io:command:download');

export function downloadComand(args: CommandDownloadInput, done: Function) {
  const logger = global['logger'];
  const destination = path.resolve(args.dir);
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  if (args.options.startdate) {
    try {
      const startDate = new Date(Date.parse(args.options.startdate));
      downloader.startDate = startDate;
      logger.info(`Using start date: ${startDate.getFullYear()}-${startDate.getMonth().toFixed(2)}-` +
        `${startDate.getDate().toFixed(2)}`);
    } catch (e) {
      logger.error(`Could not parse the date: ${args.options.startdate}`);
    }
  }
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  let outerShare;
  logger.log('executing download');
  global['_DB']
    .sync()
    .then(() => {
      return directory.create();
    })
    .then(() => {
      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      logger.log('share created: ', share.id, '(', share.complete, ')');
      ioGate.setApiUrlFromShareUrl(share.url);

      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      outerShare = share;
      logger.log('going to read files.');

      return ioGate.readFiles();
    })
    .then((response: Files) => {
      return downloader.setupHierarchy(response.files, destination);
    })
    .then((files: File[]) => {
      return File.bulkSave(files, outerShare);
    })
    .then((files: File[]) => {
      return downloader.downloadFiles(files);
    })
    .then((responses: UploadResponse[]) => {
      logger.log('Downloaded files: ', responses.length);
      const successIds = [];
      responses.forEach((response: UploadResponse) => {
        if (response.success === true) {
          successIds.push(response.file.file_id);
        }
        logger.log('Success(', response.success, '): ', response.file.name, '->', response.dest);
      });
      if (successIds.length === 0) {
        return null;
      } else {
        return true;
      }
    })
    .then(() => {
      if (args.options['watch']) {
        console.log('[watch] for new files.');
        const watcher = new DownloadWatcher(ioGate, downloader);
        watcher.watch(outerShare);
        watcher.on('error', (err: any) => {
          logger.error('Error in watcher.');
          logger.error(err);
        });
      } else {
        console.log('[download] is completed.');

        return done(null);
      }
    })
    .catch((e: any) => {
      logger.error(e);
    });
}
