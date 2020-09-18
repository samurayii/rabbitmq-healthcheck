import { ILogger } from "logger-flx";
import { IRabbitMQHelathcheck, IRabbitMQHelathcheckConfig } from "./interfaces";
import { connect, Connection, Channel} from "amqplib";

export * from "./interfaces";

export class RabbitMQHelathcheck implements IRabbitMQHelathcheck {

    private _id_interval: ReturnType<typeof setInterval>
    private _id_settimeout: ReturnType<typeof setTimeout>
    private _healthy: boolean
    private _reconnect_flag: boolean
    private _ping_flag: boolean
    private _close_connection_flag: boolean
    private readonly _host: string
    private readonly _port: number
    private readonly _user: string
    private readonly _password: string
    private _channel: Channel
    private _connection: Connection
    private _running_flag: boolean
    private _start_time: number

    constructor (
        private readonly _config: IRabbitMQHelathcheckConfig,
        private readonly _logger: ILogger
    ) {

        this._reconnect_flag = false;
        this._close_connection_flag = true;
        this._healthy = false;
        this._running_flag = false;
        this._start_time = Date.now();

        this._host = "localhost";
        this._port = 5672;
        this._user = "guest";
        this._password = "guest";

        const arg = this._config.host.match(/((.+)\:(.+)@|)([-a-zA-Z0-9_.]{1,256})\:*([0-9]{1,5}|)/);

        if (arg) {

            if (arg[2] && arg[2] !== "") {
                this._user = arg[2];
            }

            if (arg[3] && arg[3] !== "") {
                this._password = arg[3];
            }

            if (arg[4] && arg[4] !== "") {
                this._host = arg[4];
            }
            
            if (arg[5] && arg[5] !== "") {
                this._port = parseInt(arg[5]);
            }

        }

    }

    get healthy (): boolean {
        return this._healthy;
    }

    get time (): number {
        return this._start_time;
    }

    run (): void {

        if (this._running_flag === true) {
            return;
        }

        this._logger.log("[Rabbitmq] Running healthcheck", "dev");

        this._running_flag = true;

        this._id_interval = setInterval( () => {
            this._ping();
        }, this._config.ping_interval * 1000);
        this._createChannel();
    }

    stop (): void {

        if (this._running_flag === false) {
            return;
        }

        this._logger.log("[Rabbitmq] Stopping healthcheck", "dev");

        this._running_flag = false;

        clearInterval(this._id_interval);
        clearTimeout(this._id_settimeout);
        this._disconnect();
    }

    _reconnect(): void {

        this._ping_flag = false;
        this._healthy = false;

        if (!this._reconnect_flag) {

            this._logger.log(`[Rabbitmq] Connection to server will be recreated in ${this._config.reconnect_interval} seconds`);

            this._reconnect_flag = true;

            this._id_settimeout = setTimeout( () => {

                const createNewConnection = () => {

                    this._channel = undefined;
                    this._connection = undefined;

                    this._createChannel();

                };

                if (this._connection !== undefined && this._close_connection_flag === false) {
                    
                    this._connection.close().then( () => {
    
                        createNewConnection();
    
                    }).catch( () => {
                        
                        createNewConnection();
    
                    });
    
                } else {
    
                    createNewConnection();
                }

            }, this._config.reconnect_interval*1000);

        }

    }

    _disconnect(): void {

        this._ping_flag = false;
        this._healthy = false;

        const clearConnection = () => {
            this._channel = undefined;
            this._connection = undefined;
        };

        if (this._connection !== undefined && this._close_connection_flag === false) {

            this._close_connection_flag = true;

            this._connection.close().then( () => {
                clearConnection();
            }).catch( () => {
                clearConnection();
            });
            
        } else {
            clearConnection();
        }
    }

    _createChannel(): void {

        this._reconnect_flag = false;

        connect({
            protocol: "amqp",
            hostname: this._host,
            port: this._port,
            username: this._user,
            password: this._password,
            vhost: this._config.v_host,
            heartbeat: this._config.heartbeat
        }).then( (connection) => {

            this._logger.log("[Rabbitmq] Creation of connection to server succeeded", "dev");

            connection.createChannel().then( (channel) => {

                this._logger.log("[Rabbitmq] Creation of channel to server succeeded", "dev");

                connection.on("blocked", (reason) => {
                    this._ping_flag = false;
                    if (!this._reconnect_flag) {
                        this._logger.error(`[Rabbitmq] Connection to server is blocked. Reason: ${reason}`);
                        this._reconnect();
                    }
                });

                connection.on("unblocked", () => {
                    this._logger.log("[Rabbitmq] Connection to server unblocked");
                });

                connection.on("error", (error) => {
                    if (!this._reconnect_flag) {
                        this._logger.error(`[Rabbitmq] Problem in connection to server. ${error}`);
                        this._reconnect();
                    }
                });

                connection.on("close", () => {
                    this._close_connection_flag = true;
                    if (!this._reconnect_flag) {
                        this._logger.error("[Rabbitmq] Connection to server closed");
                        this._reconnect();
                    }
                });

                channel.on("error", (error) => {
                    if (!this._reconnect_flag) {
                        this._logger.error(`[Rabbitmq] Channel problem in connection to server. ${error}`);
                        this._reconnect();
                    }
                });

                channel.on("close", () => {
                    if (!this._reconnect_flag) {
                        this._logger.error("[Rabbitmq] Connection channel to server closed");
                        this._reconnect();
                    }
                });

                this._channel = channel;
                this._connection = connection;

                this._channel.assertQueue(this._config.queue, {
                    autoDelete: true,
                    durable: false,
                    arguments: {
                        "x-message-ttl": this._config.ping_interval * 1000,
                        "x-max-length-bytes": 10,
                        "x-expires": this._config.ping_interval * 1000 * 3
                    }
                }).then( () => {

                    this._logger.log(`[Rabbitmq] Queue "${this._config.queue}" created`, "dev");
            
                    this._channel.consume(this._config.queue, (message)=> {

                        this._healthy = true;

                        this._channel.nack(message, false, false);
            
                    }, {
                        consumerTag: "healthcheck"
                    }).then( () => {

                        this._logger.log(`[Rabbitmq] Consuming on queue "${this._config.queue}" created`, "dev");
                        
                        this._close_connection_flag = false;
                        this._ping_flag = true;
    
                        this._close_connection_flag = false;
    
                        this._ping_flag = true;

                    }).catch( (error) => {
            
                        this._logger.error(`[Rabbitmq] Consuming on server failed. ${error}`);
                        this._logger.log(error.stack, "debug");
                        this._reconnect();
            
                    });
        
        
                }).catch( (error) => {
        
                    this._logger.error(`[Rabbitmq] Queue "${this._config.queue}" creation on server failed. ${error}`);
                    this._logger.log(error.stack, "debug");
                    this._reconnect();
        
                });

            }).catch( (error) => {

                this._logger.error(`[Rabbitmq] Channel creation to server failed. ${error}`);
                this._logger.log(error.stack, "debug");
                this._reconnect();

            });

        }).catch( (error) => {

            this._logger.error(`[Rabbitmq] Connection to server failed. ${error}`);
            this._logger.log(error.stack, "debug");
            this._reconnect();

        });

    }

    _ping (): void {

        if (this._ping_flag === true) {
     
            try {
                this._channel.sendToQueue(this._config.queue, Buffer.from("ping"));
            } catch (error) {
                this._logger.error(`[Rabbitmq] Problem during sending message to queue "${this._config.queue}". ${error}`);
                this._logger.log(error.stack, "debug");
                this._reconnect();
            }

        }

    }

}