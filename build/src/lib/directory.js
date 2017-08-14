"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class Directory {
    constructor(path) {
        this.path = path;
    }
    create() {
        return new Promise((resolve, reject) => {
            console.log('Creating dir: ', this.path);
            fs.mkdir(this.path, (err) => {
                if (err instanceof Error) {
                    if (/EEXIST/ig.test(err.message)) {
                        return resolve(null);
                    }
                    return reject(err);
                }
                console.log('created dir: ', this.path);
                return resolve(null);
            });
        });
    }
}
exports.Directory = Directory;
//# sourceMappingURL=directory.js.map