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

export interface NotificationReq extends Request {
  body: HivedStatusNotif | BlockStatNotif
}
