/**
 * We don't need to invalidate sub paths if a parent has a wild card
 * invalidation. i.e. if `/users/*` exists, we don't need to invalidate `/users/details/*`
 */
export declare const reduceInvalidationPaths: (invalidationPaths: string[]) => string[];
