import { CommandDownloadInput, Files, UploadResponse, Share } from '../lib/types';
import { IOGates } from '../lib/iogates';
import { Downloader } from '../lib/downloader';
import { Directory } from '../lib/directory';
// import debug from 'debug';
const log = console.log;
// const log = debug('io:command:download');

export function downloadComand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  log('executing download');
  directory
    .create()
    .then(() => {
      log(destination, 'created');

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
    .then(() => {
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
        console.log('Success(', response.success, '): ', response.file.name, '->', response.dest);
      });
      done(null, responses);
    })
    .catch((e: Error) => {
      console.log(e);
    });
}
