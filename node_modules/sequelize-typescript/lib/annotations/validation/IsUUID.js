"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var models_1 = require("../../services/models");
/**
 * Only allow uuids
 */
function IsUUID(version) {
    return function (target, propertyName) {
        return models_1.addAttributeOptions(target, propertyName, {
            validate: {
                isUUID: version
            }
        });
    };
}
exports.IsUUID = IsUUID;
//# sourceMappingURL=IsUUID.js.map