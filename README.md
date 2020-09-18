# Rabbitmq healthcheck

## Информация

Сервис для проверки здоровья rabbitmq.

## Оглавление

- [Установка](#install)
- [Ключи запуска](#launch)
- [Конфигурация](#configuration)
- [API](#api)

## <a name="install"></a> Установка и использование

пример установки: `npm install rabbitmq-healthcheck -g`

пример запуска: `rabbitmq-healthcheck -c config.toml`

## <a name="launch"></a> Таблица ключей запуска
Ключ | Описание
------------ | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
--config, -c | путь к файлу конфигурации в формате toml или json, (переменная среды: RABBITMQ_HEALTHCHECK_CONFIG_PATH)

## <a name="configuration"></a> Конфигурация

Программа настраивается через файл конфигурации двух форматов TOML или JSON. Так же можно настраивать через переменные среды, которые будут считаться первичными.

### Секции файла конфигурации

- **logger** - настрока логгера (переменная среды: RABBITMQ_HEALTHCHECK_LOGGER)
- **api** - настройка API (переменная среды: RABBITMQ_HEALTHCHECK_API)
- **rabbitmq** - настройки подключения к rabbitmq (переменная среды: RABBITMQ_HEALTHCHECK_RABBITMQ)

### Пример файла конфигурации config.toml

```toml
[logger]                # настройка логгера
    mode = "prod"       # режим (prod или dev или debug)
    enable = true       # активация логгера
    timestamp = "none"  # выводить время лога (none, time или full)
    type = true         # выводить тип лога (true или false)

[api]                                   # настройка API
    enable = true                       # активация API
    listening = "*:3001"                # настройка слушателя
    prefix = "/"                        # префикс
    proxy = false                       # когда поле заголовка true proxy будут доверенным
    subdomain_offset = 2                # смещение от поддомена для игнорирования
    proxy_header = "X-Forwarded-For"    # заголовок IP прокси
    ips_count = 0                       # максимальное количество IP прочитанное из заголовка прокси, по умолчанию 0 (означает бесконечность)
    env = "development"                 # среда для сервера koa
    #keys = []                          # массив подписанных ключей cookie

[rabbitmq]                              # настройки подключения к rabbitmq
    reconnect_interval = 10             # интервал переподключения в секундах
    ping_interval = 5                   # интервал опроса
    host = "guest:guest@host:5672"      # адрес сервера
    v_host = "/"                        # виртуальный хост rabbitmq
    heartbeat = 30                      # сердцебиение
    queue = "_ping"                     # имя очереди
```

### Настройка через переменные среды

Ключи конфигурации можно задать через переменные среды ОС. Имя переменной среды формируется из двух частей, префикса `RABBITMQ_HEALTHCHECK_` и имени переменной в верхнем реестре. Если переменная вложена, то это обозначается символом `_`. Переменные среды имеют высший приоритет.

пример для переменной **logger.mode**: `RABBITMQ_HEALTHCHECK_LOGGER_MODE`

### Таблица параметров конфигурации

| Параметр | Тип | Значение | Описание |
| ----- | ----- | ----- | ----- |
| logger.mode | строка | prod | режим отображения prod, dev или debug |
| logger.enable | логический | true | активация логгера |
| logger.timestamp | логический | false | выводить время лога (true или false) |
| logger.type | логический | true | выводить тип лога (true или false) |
| api.enable | логический | false | активация API (true или false) |
| api.auth | логический | false | активация авторизации (true или false) |
| api.listening | строка | *:3001 | настройка слушателя, формат <хост>:<порт> |
| api.prefix | строка | /api | префикс |
| api.proxy | логический | false | когда поле заголовка true proxy будут доверенным |
| api.subdomain_offset | число | 2 | смещение от поддомена для игнорирования |
| api.proxy_header | строка | X-Forwarded-For | заголовок IP прокси |
| api.ips_count | число | 0 | максимальное количество IP прочитанное из заголовка прокси, по умолчанию 0 (означает бесконечность) |
| api.env | строка | development | среда для сервера [koa](https://www.npmjs.com/package/koa) |
| api.keys | строка[] |  | массив подписанных ключей cookie |
| rabbitmq.reconnect_interval | число | 10 | интервал переподключения в секундах |
| rabbitmq.ping_interval | число | 5 | интервал опроса |
| rabbitmq.host | строка | guest:guest@host:5672 | адрес сервера |
| rabbitmq.v_host | строка | / | виртуальный хост rabbitmq |
| rabbitmq.heartbeat | число | 30 | сердцебиение |
| rabbitmq.queue | строка | _ping | имя очереди |

## <a name="api"></a> API

Сервис предоставляет API, который настраивается в секции файла настройки **api**. API доступно по протоколу HTTP.

### Примеры применения

проверить здоровье сервиса: `curl http://localhost:3001/healthcheck`
получить статус здоровья: `curl http://localhost:3001/healthcheck/status`

| URL | Метод | Код | Описание | Пример ответа |
| ----- | ----- | ----- | ----- | ----- |
| / | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck/status | GET | 200 | получить статус здоровья | [пример](#api_status) |

### <a name="api_status"></a> Пример ответа запроса: /healthcheck/status

```js
{
    "healthy": true,
    "work_time": 121331231
    "human_work_time": "1d3s"
}
```