import {
  CommandUploadInput,
  Share,
  File
} from '../types';
import { IOGates } from '../lib/iogates';
import { Directory } from '../lib/directory';
import * as winston from 'winston';
import { Uploader } from '../lib/uploader';
import { UploadWatcher } from '../lib/watcher';
import * as fs from 'fs';

export function uploadCommand(args: CommandUploadInput, done: Function) {
  const destination = args.dir;
  const shareUrl = args.url;
  const ioGate: IOGates = new IOGates();
  const uploader: Uploader = new Uploader(ioGate);
  const directory: Directory = new Directory(destination);
  const logger = global['logger'];
  const deleteAfterUpload: boolean = args.options.delete;
  let readStreamFiles: File[];
  let outerShare: Share;
  logger.info('executing upload');
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
      logger.info('share created: ', share.id, '(', share.complete, ')');

      ioGate.setApiUrlFromShareUrl(share.url);

      return ioGate.authenticateFromUrl(share);
    })
    .then((share: Share) => {
      share.direction = Share.DIRECTION_UPLOAD;

      return share.save(); // updated w/ token and stuff.
    })
    .then((share: Share) => {
      logger.info('Saving the files in local db');

      outerShare = share;

      return File.saveReadStreamFiles(readStreamFiles, share);
    })
    .then((files: File[]) => {
      logger.info('Going to create files on ioGates.');

      return ioGate.createFiles(files);
    })
    .then((files: File[]) => {
      logger.info(`Files created: ${files.length}`);

      return uploader.uploadFiles(files, outerShare);
    })
    .then((files: File[]) => {
      logger.info('Uploaded files: ', files.length);
      const successIds = [];

      files.forEach((file: File) => {
        if (file.uploaded) {
          successIds.push(file.file_id);

          if (deleteAfterUpload === true) {
            fs.unlink(file.stream_path, (err: Error) => {
              if (err) {
                logger.error(`Could not delete ${file.name}. ${err}`);
              } else {
                logger.info(`Deleted file: ${file.name}.`);
              }
            });
          }
        }
        logger.info(`Success(${file.uploaded}): ${file.name}`);
      });
      if (successIds.length === 0) { return null; }

      return Promise.resolve(null);
    })
    .then(() => {
      logger.info('done saving.');
      if (args.options.watch) {
        logger.info('[watch] for new files.');
        let watcher: UploadWatcher;
        // if (args.options.delay) {
        //   watcher = new UploadWatcher(destination, +args.options.delay);
        // } else {
        // }
        watcher = new UploadWatcher(destination);

        watcher.watch(outerShare);
        watcher.on('error', (err) => {
          winston.error('[watch] error: ', err);
        });
        watcher.on('success', (file: File) => {
          if (deleteAfterUpload === true) {
            fs.unlink(file.stream_path, (err: Error) => {
              if (err) {
                logger.error(`Could not delete ${file.name}. ${err}`);
              } else {
                logger.info(`Deleted file: ${file.name}.`);
              }
            });
          }
        });
      } else {
        logger.info('[upload] is completed.');

        return done(null);
      }
    })
    .catch((err: Error) => {
      // winston.error(err);
      logger.error(`JSON.stringify(err)`);
    });
}
