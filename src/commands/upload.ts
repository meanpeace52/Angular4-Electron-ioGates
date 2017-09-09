import {
  CommandUploadInput,
  Share,
  File
} from '../types';
import { IOGates } from '../lib/iogates';
import { Directory } from '../lib/directory';
import * as winston from 'winston';
import {Uploader} from "../lib/uploader";

export function uploadCommand(args: CommandUploadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const ioGate: IOGates = new IOGates();
  const uploader: Uploader = new Uploader();
  const directory: Directory = new Directory(destination);
  let log = function (...p) { };
  if (args.options['verbose']) {
    log = winston.info;
  }
  let readStreamFiles: File[];
  let outerShare: Share;
  log('executing upload');
  global['_DB']
    .sync()
    .then(() => {
      return directory.read();
    })
    .then((files: File[]) => {
      readStreamFiles = files;
      return Promise.resolve();
    })
    .then(() => {
      return Share.LOOKUP(shareUrl, destination);
    })
    .then((share: Share) => {
      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then((share) => {
      outerShare = share;
      return File.saveReadStreamFiles(readStreamFiles, share);
    })
    .then((files: File[]) => {
      return uploader.uploadFiles(files, outerShare);
    })
    .then(() => {
      return done(null);
    })
    .catch((err: Error) => {
      console.log(err);
    })

}