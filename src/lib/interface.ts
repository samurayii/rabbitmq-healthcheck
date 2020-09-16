import { ILoggerConfig } from "logger-flx";
import { IApiServerConfig } from "../http";


export interface IAppConfig {
    logger: ILoggerConfig
    api: IApiServerConfig
    //rabbitmq: asd
}