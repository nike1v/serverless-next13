import { Component } from "@serverless/core";
declare class AwsLambda extends Component {
    context: any;
    state: any;
    save: () => void;
    load: (name: string) => any;
    default(inputs?: Record<string, unknown>): Promise<Pick<any, string>>;
    publishVersion(): Promise<{
        version: string;
    }>;
    remove(): Promise<Pick<any, string>>;
}
export default AwsLambda;
