"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLambdaVersions = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
async function listLambdaVersions(lambda, fnName) {
    return await lambda
        .listVersionsByFunction({
        FunctionName: fnName,
        MaxItems: 50
    })
        .promise();
}
async function removeLambdaVersion(lambda, fnName, version) {
    return await lambda
        .deleteFunction({ FunctionName: fnName, Qualifier: version })
        .promise();
}
async function getLambdaFunction(lambda, fnName) {
    return await lambda
        .getFunctionConfiguration({ FunctionName: fnName })
        .promise();
}
async function removeLambdaVersions(context, fnName, region) {
    var _a;
    const lambda = new aws_sdk_1.default.Lambda({ region });
    const fnConfig = await getLambdaFunction(lambda, fnName);
    const versions = await listLambdaVersions(lambda, fnConfig.FunctionName);
    for (const version of (_a = versions.Versions) !== null && _a !== void 0 ? _a : []) {
        if (version.Version && version.Version !== fnConfig.Version) {
            try {
                context.debug(`Removing function: ${fnConfig.FunctionName} - ${version.Version}`);
                await removeLambdaVersion(lambda, fnConfig.FunctionName, version.Version);
            }
            catch (e) {
                context.debug(`Remove failed (${fnConfig.FunctionName} - ${version.Version}): ${e.message}`);
            }
        }
    }
}
exports.removeLambdaVersions = removeLambdaVersions;
