# hived exporter

Metrics exporter for `hived` node. Currently exports block stats.

## Required Dependencies

* `nodejs` and [pnpm](https://pnpm.io) (Latest LTS, v20 minimum supported)
* Running [hived](https://gitlab.syncad.com/hive/hive) node

## Installation

```bash
git clone https://github.com/techcoderx/hived-exporter
cd hived-exporter
pnpm i
pnpm run compile
```

## Setup hived config

Enable block stats notification in `hived` config.ini file as follows:

```ini
notifications-endpoint = 127.0.0.1:8088

block-stats-report-type = FULL
block-stats-report-output = NOTIFY
```

## Start

```bash
pnpm start
```