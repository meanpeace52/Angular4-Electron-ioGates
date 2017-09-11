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
import * as winston from 'winston';
import { DownloadWatcher } from '../lib/watcher';

// import debug from 'debug';
// const log = debug('io:command:download');

export function downloadComand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  let log = function (...p) { };
  if (args.options['verbose']) {
    log = winston.info;
  }
  // const log = console.log;
  let outerShare;
  log('executing download');
  global['_DB']
    .sync()
    .then(() => {
      return directory.create();
    })
    .then(() => {
      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      log('share created: ', share.id, '(', share.complete, ')');
      ioGate.setApiUrlFromShareUrl(share.url);
      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      outerShare = share;
      log('going to read files.');

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
      log('Downloaded files: ', responses.length);
      const successIds = [];
      responses.forEach((response: UploadResponse) => {
        if (response.success === true) {
          successIds.push(response.file.file_id);
        }
        log('Success(', response.success, '): ', response.file.name, '->', response.dest);
      });
      if (successIds.length === 0) return null; 
      return File
        .update({
          downloaded: true
        }, {
          where: {
            file_id: successIds
          }
        });
    })
    .then(() => {
      log('done saving.');
      if (args.options['watch']) {
        console.log('[watch] for new files.');
        const watcher = new DownloadWatcher(destination);
        watcher.watch(outerShare);
        watcher.on('error', (err) => {
          log('[watch] error: ', err);
        });
      } else {
        console.log('[download] is completed.');
        return done(null);
      }
    })
    .catch((e: Error) => {
      console.log(e);
    });
}
