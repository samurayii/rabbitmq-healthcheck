import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware, Context, Next } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";
import { IApiServerConfig } from "../interfaces";
import { RabbitMQHelathcheck, IRabbitMQHelathcheck } from "../../lib/rabbitmq-healthcheck";

@Middleware("api-server")
export class Healthcheck implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger),
        private readonly _rabbitmq_healthcheck: IRabbitMQHelathcheck = <IRabbitMQHelathcheck>Catalog(RabbitMQHelathcheck.name)
    ) {
        this._logger.info(`[${this._app_id}] Middleware "${this._name}" assigned to application`, "dev");
    }

    _response (ctx: Context): void {

        if (this._rabbitmq_healthcheck.healthy === true) {
            ctx.body = "Healthy";
            ctx.status = 200;
        } else {
            ctx.body = "Unhealthy";
            ctx.status = 500;
        }
        
    }

    use (config: IApiServerConfig): unknown {

        return (ctx: Context, next: Next) => {

            if (ctx.url === "/healthcheck") {
                this._response(ctx);
                return;
            }

            if (!ctx.url.includes(`${config.prefix}/healthcheck`) && ctx.url !== `${config.prefix}` && ctx.url !== `${config.prefix}/`) {
                return next();
            } else {
                this._response(ctx);
                return;
            }

        };

    }
}
