import { CommandDownloadInput, Files, UploadResponse } from '../lib/types';
import { IOGates } from '../lib/iogates';
import { Downloader } from '../lib/downloader';
export function downloadComand(args: CommandDownloadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const downloader: Downloader = new Downloader();
  const ioGate: IOGates = new IOGates();
  ioGate
    .authenticateFromUrl(shareUrl)
    .then(() => {
      return ioGate.readFiles();
    })
    .then((response: Files) => {
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
