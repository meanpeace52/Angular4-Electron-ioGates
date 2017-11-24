import {
  CommandUploadInput,
  Share,
  File,
  IOGates,
  Directory,
  Uploader,
  UploadWatcher,
} from 'iotransfer-core';
import * as fs from 'fs';
import * as path from 'path';
import * as Utils from '../lib/utils';
import * as CliProgress from 'cli-progress';

export function uploadCommand(args: CommandUploadInput, done: Function) {
  const destination = path.resolve(args.dir);
  const shareUrl = args.url;
  const threads: number = args.options.thread || 3;
  const ioGate: IOGates = new IOGates();
  const uploader: Uploader = new Uploader(threads);
  uploader.logger = global['logger'];
  const directory: Directory = new Directory(destination);
  const logger = global['logger'];
  const deleteAfterUpload: boolean = args.options.delete;

  let readStreamFiles: File[];
  let outerShare: Share;
  if (args.options.chunksize !== false && Number.isInteger(args.options.chunksize)) {
    logger.info(`Setting chunk size to ${args.options.chunksize}`);
    uploader.chunkSize = args.options.chunksize;
  } else if (global['config'].upload.chunkSize) {
    uploader.chunkSize = global['config'].upload.chunkSize;
  }
  let bar: CliProgress;
  uploader.on(Uploader.EVENT_START, (file: File) => {
    if (bar) {
      bar.stop();
    }
    bar = Utils.setupProgressBar(file);
    bar.start(1000, 0);
  });
  uploader.on(Uploader.EVENT_PROGRESS, (file: File, i: number, speed: number) => {
    bar.update(i * 1000, { speed: `${speed} MB/s` });
  });
  logger.info('executing upload');
  global['_DB']
    .sync()
    .then(() => directory.read())
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
      if (args.options.watch) {
        console.log('[watch] for new files.');
        logger.info('[watch] for new files.');
        const watcher = new UploadWatcher(ioGate, uploader, directory, threads);
        watcher.logger = logger;

        watcher.watch(outerShare);
        watcher.on('error', (err: Error) => {
          logger.error('[watch] error: ', err);
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
    .catch((err: Error|null) => {
      logger.error(`Exception: ${err}`);
      if (err && err.stack) {
        logger.error(err.stack);
      }
    });
}
