# hived exporter

Metrics exporter for `hived` node. Currently exports block stats and data from `hived` API.

## Required Dependencies

* `nodejs` and [pnpm](https://pnpm.io) (Latest LTS, v20 minimum supported)
* Running [hived](https://gitlab.syncad.com/hive/hive) node

## Setup hived config

Enable block stats notification in `hived` config.ini file as follows:

```ini
notifications-endpoint = 127.0.0.1:8088

block-stats-report-type = FULL
block-stats-report-output = NOTIFY
```

## Standalone Installation

```bash
git clone https://github.com/techcoderx/hived-exporter
cd hived-exporter
pnpm i
pnpm run compile
```

## Start

```bash
pnpm start
```

## Docker

A docker compose file has been included consisting of `hived-exporter` and [VictoriaMetrics](https://victoriametrics.com). Two instances of `hived-exporter` will be created, one of which exports data from `hived` notifications (every 3 seconds) and the other exports data from `hived` APIs (every 30 seconds).

Configure the containers by copying the included `.env.docker.example` file into `.env`, and modifying the copied `.env` file as follows:

|Env Variable|Description|Default|
|-|-|-|
|HIVED_EXPORTER_LOG_LEVEL|Sets log level for exporter instances|info|
|HIVED_EXPORTER_API_NODE_URL|`hived` API endpoint to scrape API data from||
|HIVED_EXPORTER_ACCOUNTS|Comma-separated list of Hive accounts to export metrics||
|VICTORIA_PORT|Listening port for VictoriaMetrics|8428|

Run the docker compose as follows:
```bash
docker compose up -d
```

To stop the docker compose:
```bash
docker compose down
```

One-liner update command:
```bash
docker compose down; git pull; docker compose build; docker compose up -d
```