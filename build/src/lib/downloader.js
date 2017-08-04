"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const muxer_1 = require("muxer");
const MultiDownloader = require("mt-downloader");
const rx_1 = require("rx");
const R = require("ramda");
const Type = require("./types");
class Downloader {
    downloadFiles(files, dest) {
        const exec = [];
        for (const file of files) {
            exec.push(this.downloadFile(file, dest));
        }
        return Promise.all(exec);
    }
    downloadFile(file, dest) {
        dest = this.getDestination(file, dest);
        const options = {
            url: file.download,
            path: dest
        };
        const createMTDFile$ = this.createDownload(options);
        const [{ fdW$ }] = muxer_1.demux(createMTDFile$, 'fdW$');
        const downloadFromMTDFile$ = createMTDFile$
            .last()
            .map(MultiDownloader.MTDPath(options.path))
            .flatMap(MultiDownloader.DownloadFromMTDFile).share();
        const [{ fdR$, meta$ }] = muxer_1.demux(downloadFromMTDFile$, 'meta$', 'fdR$');
        const finalizeDownload$ = downloadFromMTDFile$.last()
            .withLatestFrom(fdR$, meta$, (_, fd, meta) => ({
            fd$: rx_1.Observable.just(fd),
            meta$: rx_1.Observable.just(meta)
        }))
            .flatMap(MultiDownloader.FinalizeDownload)
            .share()
            .last();
        const fd$ = finalizeDownload$
            .withLatestFrom(fdW$, fdR$)
            .map(R.tail)
            .flatMap(R.map(R.of));
        const closeFile = MultiDownloader.FILE.close(fd$).toPromise();
        const uploadResponse = new Type.UploadResponse();
        return uploadResponse.fromPromise(closeFile, file, dest);
    }
    createDownload(options) {
        return MultiDownloader.CreateMTDFile(options).share();
    }
    getDestination(file, destination) {
        if (destination.indexOf('.') === -1) {
            destination += `/${file.name}`;
        }
        return destination;
    }
}
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.js.map