

export interface IRabbitMQHelathcheck {
    run: () => void
    stop: () => void
    readonly healthy: boolean
}

export interface IRabbitMQHelathcheckConfig {
    host: string
    reconnect_interval: number
    ping_interval: number
    v_host: string
    heartbeat: number
    queue: string
}