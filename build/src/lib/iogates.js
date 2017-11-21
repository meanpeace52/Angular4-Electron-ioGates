"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const types_1 = require("./types");
const debug_1 = require("debug");
const _ = require("lodash");
const log = debug_1.default('io:lib:iogates');
class IOGates {
    constructor() {
        this.baseUrl = 'https://share-web02-transferapp.iogates.com/api';
        this.token = '';
    }
    static GET_BASE_URL(url) {
        const re = /^(https?:\/\/[a-zA-Z\-._0-9]+)(\/.*)$/i;
        const matches = re.exec(url);
        if (matches !== null) {
            return matches[1];
        }
        else {
            throw Error('Unknown Share URL scheme');
        }
    }
    authenticateFromUrl(share) {
        log('called authenticateFromUrl');
        return new Promise((resolve, reject) => {
            this.getRequest().post({
                url: '/authtoken',
                json: {
                    url: share.url,
                    deviceId: global['device-id']
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
                response.files = response.files.map((file) => {
                    return types_1.File.fromPlain(file);
                });
                return resolve(response);
            });
        });
    }
    createFiles(files) {
        return new Promise((resolve, reject) => {
            const filesToBeCreated = files.map((file) => {
                return {
                    name: file.name,
                    type: 'Other',
                    attributes: [{ name: 'path', value: file.stream_path }]
                };
            });
            this.getRequest().post({
                url: '/files',
                json: true,
                body: { files: filesToBeCreated }
            }, (err, r, response) => {
                if (r.statusCode !== 200) {
                    return reject(err);
                }
                const createdFiles = files.map((file) => {
                    file.upload_filename = _.find(response.files, { name: file.name }).upload_filename;
                    return file;
                });
                return resolve(createdFiles);
            });
        });
    }
    setToken(token) {
        this.token = token;
    }
    setBaseUrl(url) {
        this.baseUrl = url;
    }
    setApiUrlFromShareUrl(url) {
        this.setBaseUrl(`${IOGates.GET_BASE_URL(url)}/api`);
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