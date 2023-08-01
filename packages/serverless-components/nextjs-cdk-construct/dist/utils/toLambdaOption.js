"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLambdaOption = void 0;
const toLambdaOption = (key, option) => {
    if (!option)
        return undefined;
    if (typeof option !== "object" ||
        !("defaultLambda" in option ||
            "apiLambda" in option ||
            "imageLambda" in option ||
            "regenerationLambda" in option))
        return option;
    return option[key];
};
exports.toLambdaOption = toLambdaOption;
//# sourceMappingURL=toLambdaOption.js.map