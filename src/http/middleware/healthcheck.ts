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

    _getTextTime (time: number): string {

        let text = "";

        const days: number = Math.floor(time/86400);

        time = time - (days*86400);

        const hours: number = Math.floor(time/3600);

        time = time - (hours*3600);

        const minutes: number = Math.floor(time/60);

        time = time - (minutes*60);

        const seconds: number = Math.floor(time);

        if (days > 0) {
            text = `${text}${days}d`;
        }
        if (hours > 0) {
            text = `${text}${hours}h`;
        }
        if (minutes > 0) {
            text = `${text}${minutes}m`;
        }
        if (seconds > 0) {
            text = `${text}${seconds}s`;
        }

        return text;
    }

    _responseStatus (ctx: Context): void {

        ctx.body = {
            healthy: this._rabbitmq_healthcheck.healthy,
            work_time: Math.floor((Date.now() - this._rabbitmq_healthcheck.time)/1000),
            human_work_time: this._getTextTime(Math.floor((Date.now() - this._rabbitmq_healthcheck.time)/1000))
        };
        ctx.status = 200;

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

            if (ctx.url === "/_ping") {
                ctx.body = "OK";
                ctx.status = 200;
                return;
            }

            if (ctx.url === "/healthcheck/status") {
                this._responseStatus(ctx);
                return;
            }

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
