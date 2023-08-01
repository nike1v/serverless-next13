import { LambdaOption } from "../props";
export declare const toLambdaOption: <T>(key: "defaultLambda" | "apiLambda" | "imageLambda" | "regenerationLambda", option?: LambdaOption<T> | undefined) => T | undefined;
