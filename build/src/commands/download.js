"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../lib/types");
const iogates_1 = require("../lib/iogates");
const downloader_1 = require("../lib/downloader");
const directory_1 = require("../lib/directory");
const log = console.log;
function downloadComand(args, done) {
    const destination = args.dir;
    const shareUrl = args.url;
    const downloader = new downloader_1.Downloader();
    const ioGate = new iogates_1.IOGates();
    const directory = new directory_1.Directory(destination);
    let outerShare;
    log('executing download');
    directory
        .create()
        .then(() => {
        return types_1.Share.LOOKUP(shareUrl, destination);
    })
        .then((share) => {
        log('share created: ', share.id, '(', share.complete, ')');
        if (share.complete) {
        }
        return ioGate.authenticateFromUrl(share);
    })
        .then((share) => {
        log('share saved after auth.');
        return share.save();
    })
        .then((share) => {
        outerShare = share;
        log('going to read files.');
        return ioGate.readFiles();
    })
        .then((response) => {
        log('going to download files.');
        return downloader.downloadFiles(response.files, destination);
    })
        .then((responses) => {
        log('Uploaded files: ', responses.length);
        responses.forEach((response) => {
            console.log('Success(', response.success, '): ', response.file.name, '->', response.dest);
        });
        return types_1.File.STORE_FILES(responses, outerShare);
    })
        .then(() => {
        console.log('done saving.');
        return done(null);
    })
        .catch((e) => {
        console.log(e);
    });
}
exports.downloadComand = downloadComand;
//# sourceMappingURL=download.js.map