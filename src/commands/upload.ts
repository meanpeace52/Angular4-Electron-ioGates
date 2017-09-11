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
  winston.info('executing upload');
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
      winston.info('share created: ', share.id, '(', share.complete, ')');

      ioGate.setBaseUrlFromShareUrl(share.url);
      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then((share) => {
      winston.info('Saving the files in local db');

      outerShare = share;
      return File.saveReadStreamFiles(readStreamFiles, share);
    })
    .then((files: File[]) => {
      winston.info('Going to create files on ioGates.');

      return ioGate.createFiles(files);
    })
    .then((files: File[]) => {
      winston.info(`Files created: ${files.length}`);

      return uploader.uploadFiles(files, outerShare);
    })
    .then((files: File[]) => {
      winston.info('Uploaded files: ', files.length);
      let successIds = [];

      files.forEach(file => {
        if(file.uploaded) {
          successIds.push(file.file_id);
        }
        winston.info(`Success(${file.uploaded}): ${file.name}`);
      });
      if (successIds.length === 0) return null;
      return Promise.resolve(null);
    })
    .then(() => {
      winston.info('done saving.');

      return done(null);
    })
    .catch((err: Error) => {
      console.log(err);
    })

}