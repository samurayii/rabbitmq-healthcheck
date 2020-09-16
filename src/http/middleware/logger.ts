import * as koa_logger from "koa-logger";
import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";
import { IApiServerConfig } from "../interfaces";

@Middleware("api-server")
export class HttpLogger implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware "${this._name}" assigned to application`, "dev");
    }

    use ( config: IApiServerConfig ): unknown {

        return koa_logger( (str: string, args: string[]) => {

            if (!args[2].includes("/healthcheck") && args[2] !== `${config.prefix}` && args[2] !== `${config.prefix}/`) {
                this._logger.log(str, "dev");
            }
    
        });
    }
}