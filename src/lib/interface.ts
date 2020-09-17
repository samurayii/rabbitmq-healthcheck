import { ILoggerConfig } from "logger-flx";
import { IApiServerConfig } from "../http";
import { IRabbitMQHelathcheckConfig } from "./rabbitmq-healthcheck";


export interface IAppConfig {
    logger: ILoggerConfig
    api: IApiServerConfig
    rabbitmq: IRabbitMQHelathcheckConfig
}