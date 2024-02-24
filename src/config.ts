import yargs from 'yargs'
import * as dotenv from 'dotenv'

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
    }
  })
  .parseSync()

export default config
