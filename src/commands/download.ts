import { CommandDownloadInput, Files, UploadResponse, Share } from '../lib/types';
import { IOGates } from '../lib/iogates';
import { Downloader } from '../lib/downloader';
import { Directory } from '../lib/directory';

export function downloadComand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  const ioGate: IOGates = new IOGates();
  const directory: Directory = new Directory(destination);
  directory
    .create()
    .then(() => {
      console.log('created..');

      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      if (share.complete) {
        // completed share.
      }

      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then(() => {
      return ioGate.readFiles();
    })
    .then((response: Files) => {
      // check which files to download.
      return downloader.downloadFiles(response.files, destination);
    })
    .then((responses: UploadResponse[]) => {
      responses.forEach((response: UploadResponse) => {
        console.log(`Success(${response.success}): ${response.file.name} -> ${response.dest}`);
      });
      done(null, responses);
    })
    .catch((e: Error) => {
      console.log(e);
    });
}
