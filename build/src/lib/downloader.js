"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const muxer_1 = require("muxer");
const MultiDownloader = require("mt-downloader");
const rx_1 = require("rx");
const R = require("ramda");
const Type = require("./types");
const CliProgress = require("cli-progress");
const fs = require("fs");
const directory_1 = require("../lib/directory");
const downloadActivity_1 = require("../lib/downloadActivity");
class Downloader {
    constructor() {
        this.downloaded = (m) => {
            return m.map((meta) => {
                return R.sum(meta.offsets) - R.sum(R.map(R.nth(0), meta.threads)) + R.length(meta.threads) - 1;
            });
        };
    }
    static CALCULATE_TRANSFER_SPEED(sent, timestamps, buffer = null) {
        const sentLen = sent.length;
        const timeLen = timestamps.length;
        if (sentLen === 0 || timeLen === 0 || sentLen !== timeLen) {
            return 0;
        }
        const lastIdx = sentLen - 1;
        let bytes;
        let ms;
        if (buffer === null) {
            bytes = sent[lastIdx] - sent[0];
            ms = timestamps[lastIdx] - timestamps[0];
        }
        else {
            let bufferIdx = lastIdx - buffer;
            if (bufferIdx < 0) {
                bufferIdx = 0;
            }
            bytes = (sent[lastIdx] - sent[bufferIdx]);
            ms = (timestamps[lastIdx] - timestamps[bufferIdx]);
        }
        if (ms === 0) {
            return 0;
        }
        return (bytes / 1048576) / (ms / 1000);
    }
    downloadFiles(files) {
        const self = this;
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const file of files) {
                try {
                    const r = yield self.downloadFile(file);
                    results.push(r);
                    r.file.downloaded = true;
                    r.file.save();
                }
                catch (err) {
                    return reject(err);
                }
            }
            return resolve(results);
        }));
    }
    downloadFile(file) {
        const downloadActivity = new downloadActivity_1.DownloadActivity();
        return downloadActivity
            .attachFile(file)
            .onceReady()
            .then(() => {
            const mtdPath = MultiDownloader.MTDPath(file.destination);
            const options = {
                url: file.download,
                path: file.destination
            };
            const sentValues = [], sentTimestamps = [];
            const bar = new CliProgress.Bar({
                format: `${this.makeFileName(file)} [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
                stopOnComplete: true,
                clearOnComplete: false,
                etaBuffer: 20,
                fps: 5,
                payload: { speed: 'N/A' }
            }, CliProgress.Presets.shades_classic);
            bar.start(1000, 0);
            let downloadFromMTDFile$;
            if (fs.existsSync(mtdPath)) {
                global['logger'].info('resume %s', file.destination);
                downloadFromMTDFile$ = MultiDownloader.DownloadFromMTDFile(mtdPath).share();
                downloadActivity.resume();
            }
            else {
                global['logger'].info('download %s', file.destination);
                const createMTDFile$ = this.createDownload(options);
                downloadFromMTDFile$ = createMTDFile$
                    .last()
                    .map(mtdPath)
                    .flatMap(MultiDownloader.DownloadFromMTDFile).share();
                downloadActivity.start();
            }
            const [{ fdR$, meta$ }] = muxer_1.demux(downloadFromMTDFile$, 'fdR$', 'meta$');
            const finalizeDownload$ = downloadFromMTDFile$.last()
                .withLatestFrom(fdR$, meta$, (_, fd, meta) => ({
                fd$: rx_1.Observable.just(fd),
                meta$: rx_1.Observable.just(meta)
            }))
                .flatMap(MultiDownloader.FinalizeDownload)
                .share()
                .last();
            const fd$ = finalizeDownload$
                .withLatestFrom(fdR$)
                .map(R.tail)
                .flatMap(R.map(R.of));
            const closeFile = MultiDownloader.FILE.close(fd$).last().toPromise();
            this.downloaded(meta$).subscribe((d) => {
                sentValues.push(d);
                sentTimestamps.push(+new Date());
            });
            MultiDownloader
                .Completion(meta$)
                .subscribe((i) => {
                const p = Math.ceil(i * 1000);
                if (bar.value !== p) {
                    const speed = Downloader.CALCULATE_TRANSFER_SPEED(sentValues, sentTimestamps, i === 1 ? null : 10).toFixed(1);
                    bar.update(p, {
                        speed: `${speed} MB/s`
                    });
                    downloadActivity.progress(i * 100, Number(speed));
                }
            });
            return closeFile;
        })
            .then(() => {
            const uploadResponse = new Type.UploadResponse();
            downloadActivity.completed();
            uploadResponse.dest = file.destination;
            uploadResponse.success = true;
            uploadResponse.file = file;
            global['logger'].info('completed %s', file.destination);
            return uploadResponse;
        });
    }
    makeFileName(file) {
        let fileName = file.name;
        if (fileName.length > 50) {
            fileName = `${fileName.substr(0, 47)}...`;
        }
        else {
            let len = fileName.length;
            while (len < 50) {
                fileName += ' ';
                len += 1;
            }
        }
        return fileName;
    }
    setupHierarchy(entries, destination) {
        const tree = new Map();
        const files = [];
        const dirs = [];
        for (const entry of entries.filter(Boolean)) {
            entry.destination = this.location(entry, destination, tree);
            tree.set(entry.file_id, entry);
            if (entry.isDirectory()) {
                const dir = new directory_1.Directory(entry.destination);
                dirs.push(dir.create());
                continue;
            }
            files.push(entry);
        }
        return Promise
            .all(dirs)
            .then(() => {
            return files;
        });
    }
    location(file, destination, tree) {
        if (!file.parent) {
            return [destination, file.name].join('/');
        }
        const parent = tree.get(+file.parent);
        let path = this.location(parent, destination, tree);
        if (parent.type === 'dir') {
            path = [path, file.name].join('/');
        }
        else {
            path = path.split('/');
            path.pop();
            path.push(file.name);
            path = path.join('/');
        }
        return path;
    }
    createDownload(options) {
        return MultiDownloader.CreateMTDFile(options).share();
    }
}
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.js.map