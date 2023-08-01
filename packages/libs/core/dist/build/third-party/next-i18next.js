"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextI18nextIntegration = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = require("path");
const integration_base_1 = require("./integration-base");
class NextI18nextIntegration extends integration_base_1.ThirdPartyIntegrationBase {
    /**
     * This will copy all next-i18next files as needed to a lambda directory.
     */
    async execute() {
        if (await this.isPackagePresent("next-i18next")) {
            const localeSrc = (0, path_1.join)(this.nextConfigDir, "public", "locales");
            const localeDest = (0, path_1.join)(this.outputHandlerDir, "public", "locales");
            if (await fs_extra_1.default.pathExists(localeSrc)) {
                await fs_extra_1.default.copy(localeSrc, localeDest, { recursive: true });
            }
            const nextI18nextConfigSrc = (0, path_1.join)(this.nextConfigDir, "next-i18next.config.js");
            const nextI18nextConfigDest = (0, path_1.join)(this.outputHandlerDir, "next-i18next.config.js");
            if ((await fs_extra_1.default.pathExists(nextI18nextConfigSrc)) &&
                (await fs_extra_1.default.pathExists(this.outputHandlerDir))) {
                await fs_extra_1.default.copy(nextI18nextConfigSrc, nextI18nextConfigDest);
            }
        }
    }
}
exports.NextI18nextIntegration = NextI18nextIntegration;
