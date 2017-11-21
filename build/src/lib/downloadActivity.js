"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const Debug = require("debug");
const debug = Debug('activity:download');
class DownloadActivity {
    constructor() {
        this.type = 'download';
    }
    attachFile(file) {
        this.file = file;
        return this;
    }
    onceReady() {
        debug('run..');
        return new Promise((resolve, reject) => {
            const url = 'https://push.iogates.com/pub/' + this.getChannel();
            debug('url: ' + url);
            this.socket = new WebSocket(url);
            this.socket.on('open', () => {
                debug('ready');
                return resolve();
            });
            this.socket.on('error', (err) => {
                debug(err);
                return reject(err);
            });
        });
    }
    getChannel() {
        return this.channel = 'updates';
    }
    getFile() {
        return this.file;
    }
    send(payload) {
        debug('sending ' + JSON.stringify(payload));
        this.socket.send(JSON.stringify(payload));
        return payload;
    }
    start() {
        const payload = {
            type: this.type,
            action: "start",
            payload: {
                file: this.file.file_id
            }
        };
        return this.send(payload);
    }
    resume() {
        const payload = {
            type: this.type,
            action: "resume",
            payload: {
                file: this.file.file_id
            }
        };
        return this.send(payload);
    }
    progress(percent, rate) {
        const payload = {
            type: this.type,
            action: "progress",
            payload: {
                file: this.file.file_id,
                percent: percent,
                rate: rate
            }
        };
        return this.send(payload);
    }
    completed() {
        const payload = {
            type: this.type,
            action: "complete",
            payload: {
                file: this.file.file_id
            }
        };
        return this.send(payload);
    }
    failed(err) {
        const payload = {
            type: this.type,
            action: 'failed',
            payload: {
                file: this.file.file_id,
                reason: err
            }
        };
        return this.send(payload);
    }
    getType() {
        return this.type;
    }
}
exports.DownloadActivity = DownloadActivity;
//# sourceMappingURL=downloadActivity.js.map