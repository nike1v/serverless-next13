"use strict";
// removes parent paths of node_modules dir
// ../../node_modules/module/file.js -> node_modules/module/file.js
Object.defineProperty(exports, "__esModule", { value: true });
const normalizeNodeModules = (path) => {
    return path.substring(path.indexOf("node_modules"));
};
exports.default = normalizeNodeModules;
