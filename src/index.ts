#!/usr/bin/env node
import config from "./lib/entry";
import { KoaD } from "koa-ts-decorators";
import { Logger } from "logger-flx";
import { Singleton } from "di-ts-decorators";
import { RabbitMQHelathcheck } from "./lib/rabbitmq-healthcheck";

console.log(config);

import "./http";

const logger = new Logger(config.logger);
const rabbitmq_healthcheck = new RabbitMQHelathcheck(config.rabbitmq, logger);

Singleton(Logger.name, logger);
Singleton(RabbitMQHelathcheck.name, rabbitmq_healthcheck);

const api_server = new KoaD(config.api, "api-server");

const bootstrap = async () => {

    try {

        await api_server.listen( () => {
            logger.info(`[api-server] listening on network interface ${api_server.config.listening}${api_server.prefix}`);
        });

        rabbitmq_healthcheck.run();

    } catch (error) {
        logger.error(error.message);
        logger.log(error.stack);
        process.exit(1);
    }

};

bootstrap();

process.on("SIGTERM", () => {
    console.log("Termination signal received");
    rabbitmq_healthcheck.stop();
    process.exit();
});