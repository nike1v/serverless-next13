import { IncomingMessage, ServerResponse } from "http";
/**
 * Render to HTML helper. Starting in Next.js 11.1 a change was introduced so renderReqToHTML no longer returns a string.
 * See: https://github.com/vercel/next.js/pull/27319
 * This is a helper to properly render it in backwards compatible way.
 * @param page
 * @param req
 * @param res
 * @param renderMode
 */
export declare const renderPageToHtml: (page: {
    renderReqToHTML: (req: IncomingMessage, res: ServerResponse, renderMode?: "export" | "passthrough" | true) => PromiseLike<{
        renderOpts: Record<string, any>;
        html: any;
    }> | {
        renderOpts: Record<string, any>;
        html: any;
    };
}, req: IncomingMessage, res: ServerResponse, renderMode?: "export" | "passthrough" | true) => Promise<{
    html: string;
    renderOpts: Record<string, any>;
}>;
