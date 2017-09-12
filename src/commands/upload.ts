import {
  CommandUploadInput,
  Share,
  File
} from '../types';
import { IOGates } from '../lib/iogates';
import { Directory } from '../lib/directory';
import * as winston from 'winston';
import {Uploader} from '../lib/uploader';
import {UploadWatcher} from '../lib/watcher';
import * as fs from 'fs';

export function uploadCommand(args: CommandUploadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const ioGate: IOGates = new IOGates();
  const uploader: Uploader = new Uploader();
  const directory: Directory = new Directory(destination);
  let log = (...p) => { };
  if (args.options.verbose) {
    log = winston.info;
  }
  const deleteAfterUpload: boolean = args.options.delete;
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
      log('share created: ', share.id, '(', share.complete, ')');

      ioGate.setApiUrlFromShareUrl(share.url);

      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      log('Saving the files in local db');

      outerShare = share;

      return File.saveReadStreamFiles(readStreamFiles, share);
    })
    .then((files: File[]) => {
      log('Going to create files on ioGates.');

      return ioGate.createFiles(files);
    })
    .then((files: File[]) => {
      log(`Files created: ${files.length}`);

      return uploader.uploadFiles(files, outerShare);
    })
    .then((files: File[]) => {
      log('Uploaded files: ', files.length);
      const successIds = [];

      files.forEach((file: File) => {
        if (file.uploaded) {
          successIds.push(file.file_id);

          if (deleteAfterUpload === true) {
            fs.unlink(file.stream_path, (err: Error) => {
              if (err) {
                winston.error(`Could not delete ${file.name}. ${err}`);
              } else {
                log(`Deleted file: ${file.name}.`);
              }
            });
          }
        }
        log(`Success(${file.uploaded}): ${file.name}`);
      });
      if (successIds.length === 0) { return null; }

      return Promise.resolve(null);
    })
    .then(() => {
      log('done saving.');
      if (args.options.watch) {
        log('[watch] for new files.');
        let watcher: UploadWatcher;
        if (args.options.delay) {
          watcher = new UploadWatcher(destination, +args.options.delay);
        } else {
          watcher = new UploadWatcher(destination);
        }
        watcher.watch(outerShare);
        watcher.on('error', (err) => {
          winston.error('[watch] error: ', err);
        });
        watcher.on('success', (file: File) => {
          if (deleteAfterUpload === true) {
              fs.unlink(file.stream_path, (err: Error) => {
                  if (err) {
                      winston.error(`Could not delete ${file.name}. ${err}`);
                  } else {
                      log(`Deleted file: ${file.name}.`);
                  }
              });
          }
        });
      } else {
        log('[upload] is completed.');

        return done(null);
      }
    })
    .catch((err: Error) => {
        winston.error(err);
    });
}
