#!/usr/bin/env node
"use strict";
/**
 * This script allows you to run the builder from the command line. It's useful for deployments like Terraform for CDK since it can't execute Node.js code directly.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = require("src/build");
const yargs_1 = __importDefault(require("yargs"));
(0, yargs_1.default)(process.argv)
    .command("build", "build and package the serverless next.js app", undefined, async (argv) => {
    const lambdaBuildOptions = JSON.parse(argv.lambdaBuildOptions);
    const coreBuildOptions = JSON.parse(argv.coreBuildOptions);
    const builder = new build_1.LambdaBuilder(lambdaBuildOptions, coreBuildOptions);
    await builder.build(true);
})
    .option("lambdaBuildOptions", {
    alias: "l",
    type: "string",
    description: "Lambda build options",
    demandOption: true
})
    .option("coreBuildOptions", {
    alias: "c",
    type: "string",
    description: "Core build options",
    demandOptions: false
})
    .parse();
