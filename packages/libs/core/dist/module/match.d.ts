/**
 Provides matching capabilities to support custom redirects, rewrites, and headers.
 */
import { Match } from "path-to-regexp";
import { Dynamic, DynamicRoute } from "./types";
/**
 * Match the given path against a source path.
 * @param path
 * @param source
 */
export declare function matchPath(path: string, source: string): Match;
/**
 * Compile a destination for redirects or rewrites.
 * @param destination
 * @param params
 */
export declare function compileDestination(destination: string, params: any): string | null;
export declare const matchDynamic: (uri: string, routes: Dynamic[]) => string | undefined;
export declare const matchDynamicRoute: (uri: string, routes: DynamicRoute[]) => string | undefined;
