import { LambdaOption } from "../props";

export const toLambdaOption = <T>(
  key: "defaultLambda" | "apiLambda" | "imageLambda" | "regenerationLambda",
  option?: LambdaOption<T>
): T | undefined => {
  if (!option || typeof option !== "object") {
    return option as T | undefined;
  }

  if (
    "defaultLambda" in option ||
    "apiLambda" in option ||
    "imageLambda" in option ||
    "regenerationLambda" in option
  ) {
    return option[key];
  }

  return option as T | undefined;
};
