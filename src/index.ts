import express, { Request, Response } from 'express'
import cors from 'cors'
import client from 'prom-client'
import logger from './logger.js'
import { NotificationReq } from './types.js'
import { thousandSeperator } from './helpers.js'
import config from './config.js'

const app = express()
app.use(cors())

const register = new client.Registry()

// Block stat metrics
const BlockStatNum = new client.Gauge({ name: 'block_stat_num', help: 'Hive block height' })
const BlockStatTxs = new client.Gauge({ name: 'block_stat_txs', help: 'Transaction count in block' })
const BlockStatSize = new client.Gauge({ name: 'block_stat_size', help: 'Block size' })
const BlockStatOffset = new client.Gauge({ name: 'block_stat_offset', help: 'Block time offset (in µs)' })
const BlockStatBeforeTxProcessed = new client.Gauge({ name: 'block_stat_before_txs_processed', help: 'Transactions processed during pre-validation' })
const BlockStatBeforeTxAccepted = new client.Gauge({ name: 'block_stat_before_txs_accepted', help: 'Transactions accepted during pre-validation' })
const BlockStatBeforeTxFailedAuth = new client.Gauge({
  name: 'block_stat_before_txs_failed_auth',
  help: 'Transactions rejected due to authorities during pre-validation'
})
const BlockStatBeforeTxNoRc = new client.Gauge({
  name: 'block_stat_before_txs_with_no_rc',
  help: 'Transactions rejected due to no RC during pre-validation'
})
const BlockStatAfterTxExpired = new client.Gauge({ name: 'block_stat_after_txs_expired', help: 'Transactions expired during post-validation' })
const BlockStatAfterTxFailed = new client.Gauge({ name: 'block_stat_after_txs_failed', help: 'Transactions failed during post-validation' })
const BlockStatAfterTxReapplied = new client.Gauge({ name: 'block_stat_after_txs_reapplied', help: 'Transactions reapplied during post-validation' })
const BlockStatAfterTxPostponed = new client.Gauge({ name: 'block_stat_after_txs_postponed', help: 'Transactions postponed during post-validation' })
const BlockStatExecOffset = new client.Gauge({ name: 'block_stat_exec_offset', help: 'Block execution offset' })
const BlockStatExecWaitTime = new client.Gauge({ name: 'block_stat_exec_wait_time', help: 'Block exection waiting time' })
const BlockStatExecCleanupTime = new client.Gauge({ name: 'block_stat_exec_cleanup_time', help: 'Block exection cleanup time' })
const BlockStatExecTotalTime = new client.Gauge({ name: 'block_stat_exec_total_time', help: 'Block exection total time' })

register.registerMetric(BlockStatNum)
register.registerMetric(BlockStatTxs)
register.registerMetric(BlockStatSize)
register.registerMetric(BlockStatOffset)
register.registerMetric(BlockStatBeforeTxProcessed)
register.registerMetric(BlockStatBeforeTxAccepted)
register.registerMetric(BlockStatBeforeTxFailedAuth)
register.registerMetric(BlockStatBeforeTxNoRc)
register.registerMetric(BlockStatAfterTxExpired)
register.registerMetric(BlockStatAfterTxFailed)
register.registerMetric(BlockStatAfterTxReapplied)
register.registerMetric(BlockStatAfterTxPostponed)
register.registerMetric(BlockStatExecOffset)
register.registerMetric(BlockStatExecWaitTime)
register.registerMetric(BlockStatExecCleanupTime)
register.registerMetric(BlockStatExecTotalTime)

// Add JSON parsing middleware
app.use(express.json())

// PUT endpoint for hived notifications
app.put('/', (req: NotificationReq, res: Response) => {
  // Access the request body as a JSON
  let data = req.body

  switch (data.name) {
    case 'Block stats':
      BlockStatNum.set(data.value.block_stats.num)
      BlockStatTxs.set(data.value.block_stats.txs)
      BlockStatSize.set(data.value.block_stats.size)
      BlockStatOffset.set(Math.abs(data.value.block_stats.offset))
      BlockStatBeforeTxProcessed.set(data.value.block_stats.before.inc)
      BlockStatBeforeTxAccepted.set(data.value.block_stats.before.ok)
      BlockStatBeforeTxFailedAuth.set(data.value.block_stats.before.auth)
      BlockStatBeforeTxNoRc.set(data.value.block_stats.before.rc)
      BlockStatAfterTxExpired.set(data.value.block_stats.after.exp)
      BlockStatAfterTxFailed.set(data.value.block_stats.after.fail)
      BlockStatAfterTxReapplied.set(data.value.block_stats.after.appl)
      BlockStatAfterTxPostponed.set(data.value.block_stats.after.post)
      BlockStatExecOffset.set(Math.abs(data.value.block_stats.exec.offset))
      BlockStatExecWaitTime.set(data.value.block_stats.exec.pre)
      BlockStatExecCleanupTime.set(data.value.block_stats.exec.post)
      BlockStatExecTotalTime.set(data.value.block_stats.exec.all)
      logger.info(
        `Received Block #${data.value.block_stats.num} with ${data.value.block_stats.txs} txs (${thousandSeperator(
          data.value.block_stats.size
        )} bytes) -- Execution Time: ${thousandSeperator(data.value.block_stats.exec.all)}µs -- Offset: ${thousandSeperator(
          data.value.block_stats.offset
        )}µs`
      )
      break
    case 'hived_status':
      break
  }

  // Send back a response
  res.json({ ok: 1 })
})

app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})

app.listen(config.port, () => {
  logger.info(`hived metrics exporter running on port ${config.port}`)
})
