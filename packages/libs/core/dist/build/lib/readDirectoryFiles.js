"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const normalize_path_1 = __importDefault(require("normalize-path"));
const readDirectoryFiles = async (directory, ignorePatterns) => {
    const directoryExists = fs_extra_1.default.pathExistsSync(directory);
    if (!directoryExists) {
        return [];
    }
    // fast-glob only accepts posix paths so we normalize it
    const normalizedDirectory = (0, normalize_path_1.default)(directory);
    return await (0, fast_glob_1.default)(path_1.default.posix.join(normalizedDirectory, "**", "*"), {
        onlyFiles: true,
        stats: true,
        dot: true,
        ignore: ignorePatterns
    });
};
exports.default = readDirectoryFiles;
