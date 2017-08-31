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
import * as windston from 'winston';
// import debug from 'debug';
// const log = debug('io:command:download');

export function downloadComand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  let log = function(...p) {};
  if (args.options['v']) {
    log = windston.log;
  }
  // const log = console.log;
  let outerShare;
  log('executing download');
  directory
    .create()
    .then(() => {

      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      log('share created: ', share.id, '(', share.complete, ')');
      if (share.complete) {
        // completed share.
      }

      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      log('share saved after auth.');

      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      outerShare = share;
      log('going to read files.');

      return ioGate.readFiles();
    })
    .then((response: Files) => {
      log('going to download files.');
      // check which files to download.

      return downloader.downloadFiles(response.files, destination);
    })
    .then((responses: UploadResponse[]) => {
      log('Uploaded files: ', responses.length);
      responses.forEach((response: UploadResponse) => {
        log('Success(', response.success, '): ', response.file.name, '->', response.dest);
      });

      return File.STORE_FILES(responses, outerShare);
    })
    .then(() => {
      log('done saving.');

      return done(null);
    })
    .catch((e: Error) => {
      console.log(e);
    });
}
