"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const types_1 = require("../types");
const uuid = require("uuid/v1");
const mime = require("mime-types");
class Directory {
    constructor(path) {
        this.path = path;
    }
    create() {
        return new Promise((resolve, reject) => {
            global['logger'].info('creating dir %s', this.path);
            fs.mkdir(this.path, (err) => {
                if (err instanceof Error) {
                    if (/EEXIST/ig.test(err.message)) {
                        return resolve(null);
                    }
                    return reject(err);
                }
                return resolve(null);
            });
        });
    }
    read() {
        return this.create()
            .then(() => {
            try {
                let promise = [];
                let blobs = this.walkSync(this.path, []).map((filePath) => {
                    let size = fs.statSync(filePath).size;
                    let fileNameSplit = filePath.split('/');
                    let file = new types_1.File();
                    file.name = fileNameSplit[fileNameSplit.length - 1];
                    file.type = mime.lookup(file.name) || 'Other';
                    file.size = size;
                    file.uuid = uuid();
                    file.uploaded = false;
                    file.stream_path = filePath;
                    return file;
                });
                blobs.forEach((file) => promise.push(types_1.File.createMd5(file)));
                return Promise.all(promise);
            }
            catch (e) {
                return Promise.reject(e);
            }
        })
            .then((file) => Promise.resolve(file));
    }
    static getStream(path) {
        return fs.createReadStream(path);
    }
    walkSync(dir, fileList) {
        let files = fs.readdirSync(dir);
        if (!Array.isArray(fileList)) {
            fileList = [];
        }
        files.forEach(file => {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                fileList = this.walkSync(path.join(dir, file), fileList);
            }
            else {
                fileList.push(path.join(dir, file));
            }
        });
        return fileList;
    }
}
exports.Directory = Directory;
//# sourceMappingURL=directory.js.map