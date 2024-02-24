import type { Request } from 'express'

export interface Notification {
  time: string
  name: string
}

export interface HivedStatusNotif extends Notification {
  name: 'hived_status'
  value: {
    current_status: 'starting' | 'syncing' | 'interrupted' | 'finished syncing' | 'P2P stopped'
  }
}

export interface BlockStatNotif extends Notification {
  name: 'Block stats'
  value: {
    block_stats: {
      num: number
      lib: number
      type: string
      id: string
      ts: string
      bp: string
      txs: number
      size: number
      offset: number
      before: {
        inc: number
        ok: number
        auth: number
        rc: number
      }
      after: {
        exp: number
        fail: number
        appl: number
        post: number
      }
      exec: {
        offset: number
        pre: number
        work: number
        post: number
        all: number
      }
    }
  }
}

export interface MetricsType {
  [key: string]: number | { [key: string]: number }
}

export interface Metrics extends MetricsType {
  // block info
  num: number
  txs: number
  size: number
  offset: number

  // before
  txs_processed_before_block: number
  txs_accepted_before_block: number
  txs_with_failed_auth_before_block: number
  txs_with_no_rc_before_block: number

  // after
  txs_expired_after_block: number
  txs_failed_after_block: number
  txs_reapplied_after_block: number
  txs_postponed_after_block: number

  // exec
  exec_offset: number
  exec_wait_time: number
  exec_work_time: number
  exec_cleanup_time: number
  exec_total_time: number
}

export interface NotificationReq extends Request {
  body: HivedStatusNotif | BlockStatNotif
}
