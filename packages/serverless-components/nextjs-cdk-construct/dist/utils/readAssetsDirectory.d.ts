type CacheConfig = Record<string, {
    cacheControl: string;
    path: string;
}>;
declare const readAssetsDirectory: (options: {
    assetsDirectory: string;
}) => CacheConfig;
export { readAssetsDirectory };
