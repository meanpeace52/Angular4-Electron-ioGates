"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AsyncPolling = require("async-polling");
const downloader_1 = require("./downloader");
const file_1 = require("../types/models/file");
const iogates_1 = require("./iogates");
const events_1 = require("events");
const uploader_1 = require("./uploader");
const directory_1 = require("./directory");
const chokidar_1 = require("chokidar");
class Watcher extends events_1.EventEmitter {
    constructor() {
        super();
    }
}
exports.Watcher = Watcher;
class DownloadWatcher extends Watcher {
    constructor(destination, delay) {
        super();
        this.api = new iogates_1.IOGates();
        this.delay = delay || 6000;
        this.downloader = new downloader_1.Downloader();
        this.destination = destination;
    }
    watch(share) {
        if (!share.token) {
            this.emit('error', new Error('<token> is not available for this share.'));
        }
        this.api.setToken(share.token);
        const polling = AsyncPolling((end) => {
            this.api
                .readFiles()
                .then((response) => {
                const files = response.files;
                return file_1.File.filterForDownload(files);
            })
                .then((files) => {
                if (files.length === 0) {
                    return end();
                }
                return file_1.File
                    .bulkSave(files, share)
                    .then((files) => {
                    return this.downloader.downloadFiles(files);
                })
                    .then((responses) => {
                    const successIds = [];
                    responses.forEach((response) => {
                        if (response.success === true) {
                            successIds.push(response.file.file_id);
                        }
                    });
                    return file_1.File
                        .update({
                        downloaded: true
                    }, {
                        where: {
                            fileId: successIds
                        }
                    });
                })
                    .then(() => {
                    end();
                });
            })
                .catch(e => {
                this.emit('error', e);
            });
        }, this.delay);
        polling.on('error', (err) => {
            this.emit('error', err);
        });
        polling.run();
    }
}
exports.DownloadWatcher = DownloadWatcher;
class UploadWatcher extends Watcher {
    constructor(destination) {
        super();
        this.api = new iogates_1.IOGates();
        this.uploader = new uploader_1.Uploader();
        this.destination = destination;
        this.directory = new directory_1.Directory(this.destination);
        this.watcher = chokidar_1.watch(this.destination, {
            awaitWriteFinish: {
                stabilityThreshold: 5000,
                pollInterval: 100
            },
            ignorePermissionErrors: true,
            persistent: true
        });
    }
    watch(share) {
        if (!share.token) {
            this.emit('error', new Error('<token> is not available for this share.'));
        }
        this.api.setToken(share.token);
        this.watcher
            .on('add', () => this.initiateUpload(share))
            .on('change', () => this.initiateUpload(share))
            .on('addDir', () => this.initiateUpload(share));
    }
    initiateUpload(share) {
        this.directory
            .read()
            .then((files) => {
            this.files = files;
            return files;
        })
            .then(() => {
            this.api.setApiUrlFromShareUrl(share.url);
            return this.api.authenticateFromUrl(share);
        })
            .then(() => {
            return file_1.File.saveReadStreamFiles(this.files, share);
        })
            .then((files) => {
            return this.api.createFiles(files);
        })
            .then((files) => {
            return this.uploader.uploadFiles(files, share);
        })
            .then((files) => {
            let successIds = [];
            files.forEach((file) => {
                if (file.uploaded) {
                    successIds.push(file.file_id);
                    this.emit('success', file);
                }
            });
            return Promise.resolve(files);
        })
            .then((files) => {
            this.emit('success-all', files);
        })
            .catch(e => {
            this.emit('error', e);
        });
    }
}
exports.UploadWatcher = UploadWatcher;
//# sourceMappingURL=watcher.js.map