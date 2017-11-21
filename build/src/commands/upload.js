"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const iogates_1 = require("../lib/iogates");
const directory_1 = require("../lib/directory");
const winston = require("winston");
const uploader_1 = require("../lib/uploader");
const watcher_1 = require("../lib/watcher");
const fs = require("fs");
function uploadCommand(args, done) {
    const destination = args.dir;
    const shareUrl = args.url;
    const ioGate = new iogates_1.IOGates();
    const uploader = new uploader_1.Uploader();
    const directory = new directory_1.Directory(destination);
    const logger = global['logger'];
    const deleteAfterUpload = args.options.delete;
    let readStreamFiles;
    let outerShare;
    logger.info('executing upload');
    global['_DB']
        .sync()
        .then(() => {
        return directory.read();
    })
        .then((files) => {
        readStreamFiles = files;
        return Promise.resolve();
    })
        .then(() => {
        return types_1.Share.LOOKUP(shareUrl, destination);
    })
        .then((share) => {
        logger.info('share created: ', share.id, '(', share.complete, ')');
        ioGate.setApiUrlFromShareUrl(share.url);
        return ioGate.authenticateFromUrl(share);
    })
        .then((share) => {
        share.direction = types_1.Share.DIRECTION_UPLOAD;
        return share.save();
    })
        .then((share) => {
        logger.info('Saving the files in local db');
        outerShare = share;
        return types_1.File.saveReadStreamFiles(readStreamFiles, share);
    })
        .then((files) => {
        logger.info('Going to create files on ioGates.');
        return ioGate.createFiles(files);
    })
        .then((files) => {
        logger.info(`Files created: ${files.length}`);
        return uploader.uploadFiles(files, outerShare);
    })
        .then((files) => {
        logger.info('Uploaded files: ', files.length);
        const successIds = [];
        files.forEach((file) => {
            if (file.uploaded) {
                successIds.push(file.file_id);
                if (deleteAfterUpload === true) {
                    fs.unlink(file.stream_path, (err) => {
                        if (err) {
                            logger.error(`Could not delete ${file.name}. ${err}`);
                        }
                        else {
                            logger.info(`Deleted file: ${file.name}.`);
                        }
                    });
                }
            }
            logger.info(`Success(${file.uploaded}): ${file.name}`);
        });
        if (successIds.length === 0) {
            return null;
        }
        return Promise.resolve(null);
    })
        .then(() => {
        logger.info('done saving.');
        if (args.options.watch) {
            logger.info('[watch] for new files.');
            let watcher;
            watcher = new watcher_1.UploadWatcher(destination);
            watcher.watch(outerShare);
            watcher.on('error', (err) => {
                winston.error('[watch] error: ', err);
            });
            watcher.on('success', (file) => {
                if (deleteAfterUpload === true) {
                    fs.unlink(file.stream_path, (err) => {
                        if (err) {
                            logger.error(`Could not delete ${file.name}. ${err}`);
                        }
                        else {
                            logger.info(`Deleted file: ${file.name}.`);
                        }
                    });
                }
            });
        }
        else {
            logger.info('[upload] is completed.');
            return done(null);
        }
    })
        .catch((err) => {
        logger.error(`JSON.stringify(err)`);
    });
}
exports.uploadCommand = uploadCommand;
//# sourceMappingURL=upload.js.map