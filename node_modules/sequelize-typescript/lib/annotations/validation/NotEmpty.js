"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var models_1 = require("../../services/models");
/**
 * Don't allow empty strings
 */
function NotEmpty(target, propertyName) {
    models_1.addAttributeOptions(target, propertyName, {
        validate: {
            notEmpty: true
        }
    });
}
exports.NotEmpty = NotEmpty;
//# sourceMappingURL=NotEmpty.js.map