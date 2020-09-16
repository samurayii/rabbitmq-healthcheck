import * as helmet from "koa-helmet";
import { Middleware, IMiddleware } from "koa-ts-decorators";
import { ILogger, Logger } from "logger-flx";
import { Catalog } from "di-ts-decorators";

@Middleware("api-server")
export class Security implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware "${this._name}" assigned to application`, "dev");
    }

    use (): unknown {
        return helmet();
    }
}