"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../lib/types");
const iogates_1 = require("../lib/iogates");
const downloader_1 = require("../lib/downloader");
const directory_1 = require("../lib/directory");
const watcher_1 = require("../lib/watcher");
function downloadComand(args, done) {
    const destination = args.dir;
    const shareUrl = args.url;
    const downloader = new downloader_1.Downloader();
    const ioGate = new iogates_1.IOGates();
    const directory = new directory_1.Directory(destination);
    const logger = global['logger'];
    let outerShare;
    logger.log('executing download');
    global['_DB']
        .sync()
        .then(() => {
        return directory.create();
    })
        .then(() => {
        return types_1.Share.LOOKUP(shareUrl, destination);
    })
        .then((share) => {
        logger.log('share created: ', share.id, '(', share.complete, ')');
        ioGate.setApiUrlFromShareUrl(share.url);
        return ioGate.authenticateFromUrl(share);
    })
        .then((share) => {
        return share.save();
    })
        .then((share) => {
        outerShare = share;
        logger.log('going to read files.');
        return ioGate.readFiles();
    })
        .then((response) => {
        return downloader.setupHierarchy(response.files, destination);
    })
        .then((files) => {
        return types_1.File.bulkSave(files, outerShare);
    })
        .then((files) => {
        return downloader.downloadFiles(files);
    })
        .then((responses) => {
        logger.log('Downloaded files: ', responses.length);
        const successIds = [];
        responses.forEach((response) => {
            if (response.success === true) {
                successIds.push(response.file.file_id);
            }
            logger.log('Success(', response.success, '): ', response.file.name, '->', response.dest);
        });
        if (successIds.length === 0) {
            return null;
        }
        else {
            return true;
        }
    })
        .then(() => {
        if (args.options['watch']) {
            console.log('[watch] for new files.');
            const watcher = new watcher_1.DownloadWatcher(destination);
            watcher.watch(outerShare);
            watcher.on('error', (err) => {
                logger.error(err.message);
            });
        }
        else {
            console.log('[download] is completed.');
            return done(null);
        }
    })
        .catch((e) => {
        console.log(e);
        logger.error(e.message);
    });
}
exports.downloadComand = downloadComand;
//# sourceMappingURL=download.js.map