import express, { Request, Response } from 'express'
import cors from 'cors'
import client from 'prom-client'
import logger from './logger.js'
import {
  AccountRC,
  AccountRCRpcResponse,
  AccountRpcResponse,
  CoingeckoUSDPriceResponse,
  DgpRPCResponse,
  NotificationReq,
  PriceFeedRpcResponse
} from './types.js'
import { computeCurrentVests, computeRCMana, computeVPMana, thousandSeperator } from './helpers.js'
import config, { DHF_ACC } from './config.js'

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
const BlockStatExecWorkTime = new client.Gauge({ name: 'block_stat_exec_work_time', help: 'Block exection working time' })
const BlockStatExecCleanupTime = new client.Gauge({ name: 'block_stat_exec_cleanup_time', help: 'Block exection cleanup time' })
const BlockStatExecTotalTime = new client.Gauge({ name: 'block_stat_exec_total_time', help: 'Block exection total time' })

if (!config.apiScrapeOnly) {
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
  register.registerMetric(BlockStatExecWorkTime)
  register.registerMetric(BlockStatExecCleanupTime)
  register.registerMetric(BlockStatExecTotalTime)
} else {
  if (!config.apiNode) {
    logger.fatal('--api-node must be specified when scraping API data only')
    process.exit(1)
  }
  logger.info('Configuring for API scraping only')
}

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
      BlockStatOffset.set(data.value.block_stats.offset)
      BlockStatBeforeTxProcessed.set(data.value.block_stats.before.inc)
      BlockStatBeforeTxAccepted.set(data.value.block_stats.before.ok)
      BlockStatBeforeTxFailedAuth.set(data.value.block_stats.before.auth)
      BlockStatBeforeTxNoRc.set(data.value.block_stats.before.rc)
      BlockStatAfterTxExpired.set(data.value.block_stats.after.exp)
      BlockStatAfterTxFailed.set(data.value.block_stats.after.fail)
      BlockStatAfterTxReapplied.set(data.value.block_stats.after.appl)
      BlockStatAfterTxPostponed.set(data.value.block_stats.after.post)
      BlockStatExecOffset.set(data.value.block_stats.exec.offset)
      BlockStatExecWaitTime.set(data.value.block_stats.exec.pre)
      BlockStatExecWorkTime.set(data.value.block_stats.exec.work)
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

// scrape api responses
if (config.apiNode) {
  const DgpVirtualSupply = new client.Gauge({ name: 'dgp_virtual_supply', help: 'Virtual HIVE supply' })
  const DgpCurrentSupply = new client.Gauge({ name: 'dgp_current_supply', help: 'Current HIVE circulating supply' })
  const DgpCurrentHBDSupply = new client.Gauge({ name: 'dgp_current_hbd_supply', help: 'Current HBD circulating supply including DHF' })
  const DgpTotalVestingFundHive = new client.Gauge({ name: 'dgp_total_vesting_fund_hive', help: 'Total HIVE staked' })
  const DgpTotalVestingShares = new client.Gauge({ name: 'dgp_total_vesting_shares', help: 'Total vesting shares' })
  const DgpHBDIntRate = new client.Gauge({ name: 'dgp_hbd_interest_rate', help: 'Current HBD interest rate' })
  const DgpMaxBlockSize = new client.Gauge({ name: 'dgp_maximum_block_size', help: 'Maximum block size' })
  const AccountBalance = new client.Gauge({ name: 'account_balance', help: 'Liquid HIVE balance', labelNames: ['name'] })
  const AccountHBDBalance = new client.Gauge({ name: 'account_hbd_balance', help: 'Liquid HBD balance', labelNames: ['name'] })
  const AccountSavingsBalance = new client.Gauge({ name: 'account_savings_balance', help: 'Savings HIVE balance', labelNames: ['name'] })
  const AccountHBDSavingsBalance = new client.Gauge({ name: 'account_savings_hbd_balance', help: 'Savings HBD balance', labelNames: ['name'] })
  const AccountVests = new client.Gauge({ name: 'account_vesting_shares', help: 'Vesting shares', labelNames: ['name'] })
  const AccountVestsCurrent = new client.Gauge({ name: 'account_vests_current', help: 'Current vesting shares', labelNames: ['name'] })
  const AccountCurationRewards = new client.Gauge({ name: 'account_curation_rewards', help: 'Total curation rewards', labelNames: ['name'] })
  const AccountPostingRewards = new client.Gauge({ name: 'account_posting_rewards', help: 'Total author rewards', labelNames: ['name'] })
  const AccountMana = new client.Gauge({ name: 'account_mana', help: 'Account voting and RC mama percent', labelNames: ['name', 'type'] })
  const MarketInfo = new client.Gauge({ name: 'market_info_hive', help: 'HIVE market info from Coingecko', labelNames: ['currency', 'key'] })

  register.registerMetric(DgpVirtualSupply)
  register.registerMetric(DgpCurrentSupply)
  register.registerMetric(DgpCurrentHBDSupply)
  register.registerMetric(DgpTotalVestingFundHive)
  register.registerMetric(DgpTotalVestingShares)
  register.registerMetric(DgpHBDIntRate)
  register.registerMetric(DgpMaxBlockSize)
  register.registerMetric(AccountBalance)
  register.registerMetric(AccountHBDBalance)
  register.registerMetric(AccountSavingsBalance)
  register.registerMetric(AccountHBDSavingsBalance)
  register.registerMetric(AccountVests)
  register.registerMetric(AccountVestsCurrent)
  register.registerMetric(AccountCurationRewards)
  register.registerMetric(AccountPostingRewards)
  register.registerMetric(AccountMana)
  register.registerMetric(MarketInfo)

  const accountsExclDhf = config.account.filter((val) => val !== DHF_ACC)

  const scrapeApi = async () => {
    try {
      let resp = await fetch(config.apiNode, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          {
            id: 1,
            jsonrpc: '2.0',
            method: 'database_api.get_dynamic_global_properties'
          },
          {
            id: 2,
            jsonrpc: '2.0',
            method: 'condenser_api.get_accounts',
            params: [config.account]
          },
          {
            id: 3,
            jsonrpc: '2.0',
            method: 'rc_api.find_rc_accounts',
            params: { accounts: accountsExclDhf }
          }
        ])
      })
      if (resp && resp.status === 200) {
        let result: [DgpRPCResponse, AccountRpcResponse, AccountRCRpcResponse] = await resp.json()
        if (!result[0].error) {
          DgpVirtualSupply.set(parseInt(result[0].result.virtual_supply.amount))
          DgpCurrentSupply.set(parseInt(result[0].result.current_supply.amount))
          DgpCurrentHBDSupply.set(parseInt(result[0].result.current_hbd_supply.amount))
          DgpTotalVestingFundHive.set(parseInt(result[0].result.total_vesting_fund_hive.amount))
          DgpTotalVestingShares.set(parseInt(result[0].result.total_vesting_shares.amount))
          DgpHBDIntRate.set(result[0].result.hbd_interest_rate)
          DgpMaxBlockSize.set(result[0].result.maximum_block_size)
        }
        if (!result[1].error) {
          for (const a in result[1].result) {
            const acc = result[1].result[a]
            const currentVests = computeCurrentVests(acc)
            const upvoteVP = computeVPMana(acc, false)
            const downvoteVP = computeVPMana(acc, true)
            AccountBalance.set({ name: acc.name }, parseFloat(acc.balance))
            AccountHBDBalance.set({ name: acc.name }, parseFloat(acc.hbd_balance))
            if (acc.name !== DHF_ACC) {
              AccountSavingsBalance.set({ name: acc.name }, parseFloat(acc.savings_balance))
              AccountHBDSavingsBalance.set({ name: acc.name }, parseFloat(acc.savings_hbd_balance))
              AccountVests.set({ name: acc.name }, parseFloat(acc.vesting_shares))
              AccountVestsCurrent.set({ name: acc.name }, currentVests)
              AccountCurationRewards.set({ name: acc.name }, acc.curation_rewards)
              AccountPostingRewards.set({ name: acc.name }, acc.posting_rewards)
              AccountMana.labels(acc.name, 'upvote').set(upvoteVP.percentage)
              AccountMana.labels(acc.name, 'downvote').set(downvoteVP.percentage)
            }
          }
        }
        if (!result[2].error) {
          for (let a in result[2].result.rc_accounts) {
            let acc: AccountRC = result[2].result.rc_accounts[a]
            if (acc.account !== DHF_ACC) {
              AccountMana.set({ name: acc.account, type: 'rc' }, computeRCMana(acc).percentage)
            }
          }
        }
      } else {
        logger.debug('Hive API request failed with status code ' + resp.status, resp.statusText)
      }
    } catch {}
  }

  const scrapeHIVEUSDMarketInfo = async () => {
    try {
      let resp = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd&include_market_cap=true&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false'
      )
      if (resp && resp.status === 200) {
        let result: CoingeckoUSDPriceResponse = await resp.json()
        MarketInfo.labels('usd', 'price').set(result.hive.usd)
        MarketInfo.labels('usd', 'market_cap').set(result.hive.usd_market_cap)
      } else {
        logger.debug('Coingecko API request failed with status code ' + resp.status, resp.statusText)
      }
    } catch {}
  }

  scrapeApi()
  setInterval(scrapeApi, config.apiScrapeInterval * 1000)

  scrapeHIVEUSDMarketInfo()
  setInterval(scrapeHIVEUSDMarketInfo, Math.max(config.apiScrapeInterval * 1000, 60000))
}
