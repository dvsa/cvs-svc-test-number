import {Handler} from "aws-lambda";
// @ts-ignore
import * as yml from "node-yaml";

enum HTTPMethods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

interface IFunctionEvent {
    name: string;
    method: HTTPMethods;
    path: string;
    function: Handler;
}

class Configuration {

    private static instance: Configuration;
    private readonly config: any;

    constructor(configPath: string) {
        this.config = yml.readSync(configPath);

        // Replace environment variable references
        let stringifiedConfig: string = JSON.stringify(this.config);
        const envRegex: RegExp = /\${(\w+\b):?(\w+\b)?}/g;
        const matches: RegExpMatchArray | null = stringifiedConfig.match(envRegex);

        if (matches) {
            matches.forEach((match: string) => {
                envRegex.lastIndex = 0;
                const captureGroups: RegExpExecArray = envRegex.exec(match) as RegExpExecArray;

                // Insert the environment variable if available. If not, insert placeholder. If no placeholder, leave it as is.
                stringifiedConfig = stringifiedConfig.replace(match, (process.env[captureGroups[1]] || captureGroups[2] || captureGroups[1]));
            });
        }

        this.config = JSON.parse(stringifiedConfig);
    }

    /**
     * Retrieves the singleton instance of Configuration
     * @returns Configuration
     */
    public static getInstance(): Configuration {
        if (!this.instance) {
            this.instance = new Configuration("../config/config.yml");
        }

        return Configuration.instance;
    }

    /**
     * Retrieves the entire config as an object
     * @returns any
     */
    public getConfig(): any {
        return this.config;
    }

    /**
     * Retrieves the lambda functions declared in the config
     * @returns IFunctionEvent[]
     */
    public getFunctions(): IFunctionEvent[] {
        if (!this.config.functions) {
            throw new Error("Functions were not defined in the config file.");
        }

        return this.config.functions.map((fn: Handler) => {
            const [name, params]: any = Object.entries(fn)[0];
            const path: string = (params.proxy) ? params.path.replace("{+proxy}", params.proxy) : params.path;

            return {
                name,
                method: params.method.toUpperCase(),
                path,
                function: require(`../functions/${name}`)[name]
            };
        });
    }

    /**
     * Retrieves the DynamoDB config
     * @returns any
     */
    public getDynamoDBConfig(): any {
        if (!this.config.dynamodb) {
            throw new Error("DynamoDB config is not defined in the config file.");
        }

        // Not defining BRANCH will default to remote
        let env;
        switch (process.env.BRANCH) {
            case "local":
                env = "local";
                break;
            case "local-global":
                env = "local-global";
                break;
            default:
                env = "remote";
        }

        return this.config.dynamodb[env];
    }

    /**
     * Retrieves the test number initial value
     * @returns any
     */
    public getTestNumberInitialValue(): any {
        return this.config.testNumberinitialValue;
    }

    /**
     * Retrieves the trailer id initial value
     * @returns any
     */
    public getTrailerIdInitialValue(): any {
        return this.config.trailerIdInitialValue;
    }

    /**
     * Retrieves the test number initial value
     * @returns number
     */
    public getMaxAttempts(): number {
        return this.config.maxAttempts;
    }
}
export { Configuration, IFunctionEvent };
