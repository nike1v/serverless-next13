type ForwardedValues = {
    cookies?: string | string[];
    queryString?: string;
    headers?: string | string[];
    queryStringCacheKeys?: string[];
};
declare function getForwardedValues(config?: ForwardedValues, defaults?: {}): Record<string, unknown>;
export { getForwardedValues };
