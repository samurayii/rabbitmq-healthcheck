import { ILogger, Logger } from "logger-flx";
import { Middleware, IMiddleware, Context, Next } from "koa-ts-decorators";
import { Catalog } from "di-ts-decorators";

@Middleware("api-server")
export class Errors implements IMiddleware {

    constructor (
        private readonly _app_id: string,
        private readonly _name: string,
        private readonly _logger: ILogger = <ILogger>Catalog(Logger)
    ) {
        this._logger.info(`[${this._app_id}] Middleware "${this._name}" assigned to application`, "dev");
    }

    use (): unknown {
        return async (ctx: Context, next: Next) => {

            try {

                await next();
           
                if (ctx.status === 404) {
 
                    if (ctx.is("application/json") || ctx.is("json")) {
  
                        ctx.body = { 
                            status: "error",
                            message: "not found" 
                        };
            
                    } else {   
                        ctx.body = "Not found";
                        
                    }

                    ctx.status = 404;
    
                }
        
            } catch (error) {
        
                this._logger.error(`Server Error: ${error.message}`, "prod");
                this._logger.log(error.stack, "debug");
        
                if (ctx.is("application/json") || ctx.is("json")) {
        
                    ctx.body = {
                        status: "Error",
                        message: "Something went wrong! Please try again."
                    };
        
                } else {
                    ctx.body = "Something went wrong! Please try again.";
                }

                ctx.status = error.statusCode || error.status || 500;
        
            }

        };
    }
}