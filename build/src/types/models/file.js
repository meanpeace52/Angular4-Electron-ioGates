"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const share_1 = require("./share");
const crypto_1 = require("crypto");
const fs = require("fs");
let File = File_1 = class File extends sequelize_typescript_1.Model {
    isDirectory() {
        return this.type === 'dir';
    }
    static bulkSave(files, share) {
        return global['_DB'].transaction(function transactionFn(transaction) {
            const bulk = [];
            const toDownload = [];
            files.forEach(file => {
                const record = file.get({ plain: true });
                delete record['id'];
                record.share_id = share.id;
                const fn = File_1
                    .findOrCreate({
                    where: {
                        file_id: file.file_id,
                        share_id: share.id
                    },
                    defaults: record,
                    transaction: transaction
                })
                    .spread((savedFile, created) => {
                    if (savedFile.downloaded === false) {
                        toDownload.push(savedFile);
                    }
                    else {
                        console.log(`File <${file.name}>`, 'already exists, skipping download...');
                    }
                    return savedFile;
                });
                bulk.push(fn);
            });
            return Promise
                .all(bulk)
                .then(() => {
                return toDownload;
            });
        });
    }
    static filterForDownload(files) {
        const download = [];
        const ids = [];
        files.forEach(file => ids.push(file.id));
        const promise = File_1
            .findAll({
            where: {
                file_id: ids
            },
            attributes: ['fileId'],
            raw: true
        })
            .then((existingFiles) => {
            const foundIds = existingFiles.map(r => r.file_id);
            files.forEach(file => {
                if (foundIds.indexOf(file.file_id) === -1) {
                    download.push(file);
                }
            });
            return download;
        });
        return Promise.resolve(promise);
    }
    static saveReadStreamFiles(files, share) {
        let logger = global['logger'];
        return global['_DB'].transaction(function transactionFn(transaction) {
            const bulk = [];
            const toUpload = [];
            files.forEach(file => {
                const record = file.get({ plain: true });
                delete record['id'];
                record.share_id = share.id;
                const fn = File_1
                    .findOrCreate({
                    where: {
                        md5: file.md5,
                        stream_path: file.stream_path
                    },
                    defaults: record,
                    transaction: transaction
                })
                    .spread((savedFile, created) => {
                    if (!savedFile.uploaded) {
                        toUpload.push(savedFile);
                    }
                    else {
                        logger(`File <${file.name}>`, 'already uploaded, skipping upload...');
                    }
                    return savedFile;
                });
                bulk.push(fn);
            });
            return Promise
                .all(bulk)
                .then(() => {
                return toUpload;
            });
        });
    }
    static createMd5(file) {
        let hash = crypto_1.createHash('md5');
        let stream = fs.createReadStream(file.stream_path);
        return new Promise((resolve, reject) => {
            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => {
                file.md5 = hash.digest('hex');
                return resolve(file);
            });
        });
    }
    static fromPlain(file) {
        file['file_id'] = Number(file['id']);
        return new File_1(file);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        primaryKey: true,
        unique: true,
        autoIncrement: true
    }),
    tslib_1.__metadata("design:type", Number)
], File.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], File.prototype, "file_id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "name", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "upload_filename", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "type", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], File.prototype, "parent", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "href", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "download", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        defaultValue: false
    }),
    tslib_1.__metadata("design:type", Boolean)
], File.prototype, "downloaded", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        defaultValue: false
    }),
    tslib_1.__metadata("design:type", Boolean)
], File.prototype, "uploaded", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "md5", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "destination", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Number)
], File.prototype, "size", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "stream_path", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "uuid", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], File.prototype, "resume_able", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        defaultValue: false
    }),
    tslib_1.__metadata("design:type", Boolean)
], File.prototype, "uploadStarted", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => share_1.Share),
    tslib_1.__metadata("design:type", Number)
], File.prototype, "share_id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => share_1.Share, 'share_id'),
    tslib_1.__metadata("design:type", share_1.Share)
], File.prototype, "share", void 0);
File = File_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        underscored: true,
        tableName: 'files'
    })
], File);
exports.File = File;
var File_1;
//# sourceMappingURL=file.js.map