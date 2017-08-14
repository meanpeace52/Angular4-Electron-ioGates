"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const debug_1 = require("debug");
const log = debug_1.default('io:lib:iogates');
class IOGates {
    constructor() {
        this.baseUrl = 'https://share-web02-transferapp.iogates.com/api';
        this.token = '';
    }
    authenticateFromUrl(share) {
        log('called authenticateFromUrl');
        return new Promise((resolve, reject) => {
            this.getRequest().post({
                url: '/authtoken',
                json: {
                    url: share.url
                }
            }, (err, r, data) => {
                if (r.statusCode !== 200) {
                    return reject(err);
                }
                log('received token: ', data.token);
                this.token = data.token;
                share.token = data.token;
                return resolve(share);
            });
        });
    }
    readFiles() {
        log('called readFiles');
        return new Promise((resolve, reject) => {
            this.getRequest().get({
                url: '/files',
                json: true
            }, (err, r, response) => {
                if (r.statusCode !== 200) {
                    return reject(err);
                }
                return resolve(response);
            });
        });
    }
    getRequest() {
        const options = {
            baseUrl: this.baseUrl,
            headers: {
                token: ''
            }
        };
        if (this.token.length > 0) {
            options.headers.token = this.token;
        }
        return request.defaults(options);
    }
}
exports.IOGates = IOGates;
//# sourceMappingURL=iogates.js.map