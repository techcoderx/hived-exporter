import yargs from 'yargs'
import * as dotenv from 'dotenv'

export const DHF_ACC = 'hive.fund'

dotenv.config()
const config = yargs(process.argv)
  .env('HIVED_EXPORTER')
  .options({
    logLevel: {
      type: 'string',
      default: 'info'
    },
    port: {
      type: 'number',
      default: 8088
    },
    apiNode: {
      type: 'string',
      default: ''
    },
    apiScrapeInterval: {
      type: 'number',
      default: 30
    },
    apiScrapeOnly: {
      type: 'boolean',
      default: false
    },
    account: {
      alias: 'acc',
      type: 'array',
      default: [DHF_ACC]
    }
  })
  .parseSync()

if (!config.account.includes(DHF_ACC)) {
  config.account.push(DHF_ACC)
}

export default config
