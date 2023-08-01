"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const normalize_path_1 = __importDefault(require("normalize-path"));
const readDirectoryFiles = (directory) => {
    const directoryExists = fs_extra_1.default.pathExistsSync(directory);
    if (!directoryExists) {
        return [];
    }
    const normalizedDirectory = (0, normalize_path_1.default)(directory);
    return fast_glob_1.default.sync(path_1.default.posix.join(normalizedDirectory, "**", "*"), {
        onlyFiles: true,
        stats: true,
        dot: true
    });
};
exports.default = readDirectoryFiles;
