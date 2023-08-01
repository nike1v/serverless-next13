"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilReady = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const waitUntilReady = async (context, fnName, region, pollInterval = 5000) => {
    const lambda = new aws_sdk_1.default.Lambda({ region });
    const startDate = new Date();
    const startTime = startDate.getTime();
    const waitDurationMillis = 600000;
    context.debug(`Waiting up to 600 seconds for Lambda ${fnName} to be ready.`);
    while (new Date().getTime() - startTime < waitDurationMillis) {
        const { Configuration: { LastUpdateStatus, State } } = await lambda.getFunction({ FunctionName: fnName }).promise();
        if (State === "Active" && LastUpdateStatus === "Successful") {
            return true;
        }
        await new Promise((r) => setTimeout(r, pollInterval));
    }
    return false;
};
exports.waitUntilReady = waitUntilReady;
