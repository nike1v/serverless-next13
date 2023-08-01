import { ThirdPartyIntegrationBase } from "./integration-base";
export declare class NextI18nextIntegration extends ThirdPartyIntegrationBase {
    /**
     * This will copy all next-i18next files as needed to a lambda directory.
     */
    execute(): Promise<void>;
}
