"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const file_1 = require("./file");
let Share = Share_1 = class Share extends sequelize_typescript_1.Model {
    static LOOKUP(shareUrl, destination) {
        const promise = Share_1
            .findOrCreate({
            where: {
                url: shareUrl,
                dir: destination
            },
            defaults: {
                token: '',
                complete: false
            }
        })
            .spread((share) => {
            return share;
        });
        return Promise.resolve(promise);
    }
};
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        primaryKey: true,
        unique: true,
        autoIncrement: true,
        allowNull: false
    }),
    tslib_1.__metadata("design:type", Number)
], Share.prototype, "id", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    tslib_1.__metadata("design:type", String)
], Share.prototype, "url", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column({
        allowNull: false
    }),
    tslib_1.__metadata("design:type", String)
], Share.prototype, "token", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", String)
], Share.prototype, "dir", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.Column,
    tslib_1.__metadata("design:type", Boolean)
], Share.prototype, "complete", void 0);
tslib_1.__decorate([
    sequelize_typescript_1.HasMany(() => file_1.File),
    tslib_1.__metadata("design:type", Array)
], Share.prototype, "files", void 0);
Share = Share_1 = tslib_1.__decorate([
    sequelize_typescript_1.Table({
        timestamps: true,
        underscored: true,
        tableName: 'shares'
    })
], Share);
exports.Share = Share;
var Share_1;
//# sourceMappingURL=share.js.map