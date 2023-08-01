"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThirdPartyIntegrationBase = void 0;
const path_1 = require("path");
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * This class allows one to integrate third party libraries by copying them to a specific Lambda directory.
 * Extend from this, implement the execute() method, and keep it generic enough so it can be reused across platforms.
 */
class ThirdPartyIntegrationBase {
    constructor(nextConfigDir, outputHandlerDir) {
        this.nextConfigDir = nextConfigDir;
        this.outputHandlerDir = outputHandlerDir;
    }
    async isPackagePresent(name) {
        const packageJsonPath = (0, path_1.join)(this.nextConfigDir, "package.json");
        if (await fs_extra_1.default.pathExists(packageJsonPath)) {
            const packageJson = await fs_extra_1.default.readJSON(packageJsonPath);
            if (packageJson.dependencies && packageJson.dependencies[name]) {
                return true;
            }
            if (packageJson.devDependencies && packageJson.devDependencies[name]) {
                return true;
            }
        }
        return false;
    }
}
exports.ThirdPartyIntegrationBase = ThirdPartyIntegrationBase;
