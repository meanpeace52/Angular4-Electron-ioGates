"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const share_1 = require("./share");
let File = File_1 = class File extends sequelize_typescript_1.Model {
    static STORE_FILES(response, share) {
        const promise = [];
        response.forEach((upload) => {
            const file = new File_1();
            file.name = upload.file.name;
            file.type = upload.file.type;
            file.parent = upload.file.parent;
            file.href = upload.file.href;
            file.download = upload.file.download;
            file.md5 = upload.file.md5;
            file.shareId = share.id;
            promise.push(file.save());
        });
        return Promise.all(promise);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        primaryKey: true,
        unique: true
    }),
    tslib_1.__metadata("design:type", Number)
], File.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "name", void 0);
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
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], File.prototype, "md5", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.ForeignKey(() => share_1.Share),
    tslib_1.__metadata("design:type", Number)
], File.prototype, "shareId", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.BelongsTo(() => share_1.Share, 'shareId'),
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