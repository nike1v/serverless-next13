/**
 * This class allows one to integrate third party libraries by copying them to a specific Lambda directory.
 * Extend from this, implement the execute() method, and keep it generic enough so it can be reused across platforms.
 */
export declare abstract class ThirdPartyIntegrationBase {
    protected nextConfigDir: string;
    protected outputHandlerDir: string;
    constructor(nextConfigDir: string, outputHandlerDir: string);
    abstract execute(): void;
    isPackagePresent(name: string): Promise<boolean>;
}
