"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iogates_1 = require("../lib/iogates");
const downloader_1 = require("../lib/downloader");
function downloadComand(args, done) {
    const destination = args.dir;
    const shareUrl = args.url;
    const downloader = new downloader_1.Downloader();
    const ioGate = new iogates_1.IOGates();
    ioGate
        .authenticateFromUrl(shareUrl)
        .then(() => {
        return ioGate.readFiles();
    })
        .then((response) => {
        return downloader.downloadFiles(response.files, destination);
    })
        .then((responses) => {
        responses.forEach((response) => {
            console.log(`Success(${response.success}): ${response.file.name} -> ${response.dest}`);
        });
        done(null, responses);
    })
        .catch((e) => {
        console.log(e);
    });
}
exports.downloadComand = downloadComand;
//# sourceMappingURL=download.js.map