"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = __importDefault(require("./build"));
const path_1 = require("path");
async function main(args) {
    if (args.length > 1) {
        console.error("Usage: build-lambda-at-edge [ NEXT_APP_DIR ]");
        process.exit(1);
    }
    const nextConfigDir = args[0] || ".";
    const outputDir = (0, path_1.join)(nextConfigDir, ".serverless_nextjs");
    const builder = new build_1.default(nextConfigDir, outputDir, {
        cmd: "./node_modules/.bin/next",
        cwd: process.cwd(),
        env: {},
        args: ["build"]
    });
    await builder.build();
}
main(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
});
