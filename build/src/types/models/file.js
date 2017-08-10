"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const share_1 = require("./share");
let File = class File extends sequelize_typescript_1.Model {
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
File = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        underscored: true,
        tableName: 'files'
    })
], File);
exports.File = File;
//# sourceMappingURL=file.js.map