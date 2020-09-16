import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware, Context, Next } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";
import { IApiServerConfig } from "../interfaces";

@Middleware("api-server")
export class Healthcheck implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware "${this._name}" assigned to application`, "dev");
    }

    use (config: IApiServerConfig): unknown {

        return (ctx: Context, next: Next) => {

            if (ctx.url === "/healthcheck") {
                ctx.body = "OK";
                ctx.status = 200;
                return;
            }

            if (!ctx.url.includes(`${config.prefix}/healthcheck`) && ctx.url !== `${config.prefix}` && ctx.url !== `${config.prefix}/`) {
                return next();
            } else {
                ctx.body = "OK";
                ctx.status = 200;
                return;
            }

        };

    }
}
