"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const tus_js_client_1 = require("tus-js-client");
const CliProgress = require("cli-progress");
const directory_1 = require("./directory");
const iogates_1 = require("./iogates");
const _ = require("lodash");
const downloader_1 = require("./downloader");
class Uploader {
    constructor() {
        this.baseUrl = 'https://share-web02-transferapp.iogates.com';
        this.token = '';
    }
    uploadFiles(files, share) {
        this.token = share.token;
        this.baseUrl = iogates_1.IOGates.GET_BASE_URL(share.url);
        let self = this;
        const results = [];
        return new Promise((resolve, reject) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const file of files) {
                try {
                    const r = yield self.uploadFile(file);
                    results.push(r);
                }
                catch (err) {
                }
            }
            return resolve(results);
        }));
    }
    uploadFile(file) {
        let logger = global['logger'];
        const sentValues = [];
        const sentTimestamps = [];
        return new Promise((resolve, reject) => {
            const extIndex = _.lastIndexOf(file.name, '.');
            const bar = new CliProgress.Bar({
                format: `${file.name} \t [{bar}] {percentage}% | ETA: {eta}s | Speed: {speed}`,
                stopOnComplete: true,
                clearOnComplete: false,
                etaBuffer: 20,
                fps: 5,
                payload: { speed: 'N/A' }
            }, CliProgress.Presets.shades_classic);
            bar.start(100, 0);
            const uploadOptions = {
                endpoint: `${this.baseUrl}/upload/tus/${this.token}`,
                uploadUrl: null,
                uploadSize: file.size,
                resume: true,
                chunkSize: 16777216,
                retryDelays: [0, 1000, 3000, 5000],
                metadata: {
                    filename: `${file.upload_filename}${file.name.substr(extIndex, file.name.length)}`,
                    uuid: file.uuid
                },
                onError: (error) => {
                    logger.error(JSON.stringify(error));
                    tusUploader.abort();
                    return reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    sentValues.push(bytesUploaded);
                    sentTimestamps.push(+new Date());
                    const progress = bytesUploaded / bytesTotal;
                    const percentage = (progress * 100).toFixed(2);
                    const rate = downloader_1.Downloader.CALCULATE_TRANSFER_SPEED(sentValues, sentTimestamps, progress >= 1 ? null : 10);
                    bar.update(percentage, {
                        speed: `${rate.toFixed(1)} MB/s`
                    });
                },
                onSuccess: () => {
                    file.uploaded = true;
                    file.save()
                        .then((f) => {
                        return resolve(f);
                    });
                    bar.update(100);
                }
            };
            if (file.uploadStarted) {
                uploadOptions.uploadUrl = `${this.baseUrl}/upload/tus/${this.token}/${file.uuid}`;
            }
            const stream = directory_1.Directory.getStream(file.stream_path);
            const tusUploader = new tus_js_client_1.Upload(stream, uploadOptions);
            tusUploader.start();
            file.uploadStarted = true;
            file.resume_able = true;
            file.save();
        });
    }
}
exports.Uploader = Uploader;
//# sourceMappingURL=uploader.js.map