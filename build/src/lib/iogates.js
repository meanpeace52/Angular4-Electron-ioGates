"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
class IOGates {
    constructor() {
        this.baseUrl = 'https://share-web02-transferapp.iogates.com/api';
        this.token = '';
    }
    authenticateFromUrl(shareUrl) {
        return new Promise((resolve, reject) => {
            this.getRequest().post({
                url: '/authtoken',
                json: {
                    url: shareUrl
                }
            }, (err, r, data) => {
                if (r.statusCode !== 200) {
                    return reject(err);
                }
                this.token = data.token;
                return resolve(data);
            });
        });
    }
    readFiles() {
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