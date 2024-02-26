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

// for reference only, probably not useful for non-debugging purposes
export interface BenchmarkNotif extends Notification {
  name: 'hived_benchmark'
  value: {
    multiindex_stats: {
      block_number: number
      real_ms: number
      cpu_ms: number
      current_mem: number
      peak_mem: number
      index_memory_details_cntr: {
        index_name: string
        index_size: number
        item_sizeof: number
        item_additional_allocation: number
        additional_container_allocation: number
        total_index_mem_usage: number
      }[]
    }
  }
}

export interface NotificationReq extends Request {
  body: HivedStatusNotif | BlockStatNotif
}

export interface RPCResponse {
  id: number
  jsonrpc: '2.0'
  error?: any
}

export interface DgpRPCResponse extends RPCResponse {
  result: {
    id: 0
    head_block_number: number
    head_block_id: string
    time: string
    current_witness: string
    virtual_supply: {
      amount: string
      precision: 3
      nai: '@@000000021'
    }
    current_supply: {
      amount: string
      precision: 3
      nai: '@@000000021'
    }
    current_hbd_supply: {
      amount: string
      precision: 3
      nai: '@@000000013'
    }
    total_vesting_fund_hive: {
      amount: string
      precision: 3
      nai: '@@000000021'
    }
    total_vesting_shares: {
      amount: string
      precision: 6
      nai: '@@000000037'
    }
    hbd_interest_rate: number
    hbd_print_rate: number
    maximum_block_size: number
    participation_count: number
    last_irreversible_block_num: number
    vote_power_reserve_rate: number
    delegation_return_period: number
    reverse_auction_seconds: number
    available_account_subsidies: number
    hbd_stop_percent: number
    hbd_start_percent: number
    content_reward_percent: number
    vesting_reward_percent: number
    proposal_fund_percent: number
    dhf_interval_ledger: {
      amount: string
      precision: 3
      nai: '@@000000013'
    }
    max_consecutive_recurrent_transfer_failures: number
    max_recurrent_transfer_end_date: number
    min_recurrent_transfers_recurrence: number
    max_open_recurrent_transfers: number
  }
}

export interface AccountRpcResponse extends RPCResponse {
  result: Account[]
}

export interface Account {
  id: number
  name: string
  balance: string
  savings_balance: string
  hbd_balance: string
  savings_hbd_balance: string
  vesting_shares: string
  delegated_vesting_shares: string
  received_vesting_shares: string
  vesting_withdraw_rate: string
  to_withdraw: number
  withdrawn: number
  curation_rewards: number
  posting_rewards: number
  voting_manabar: {
    current_mana: string
    last_update_time: number
  }
  downvote_manabar: {
    current_mana: string
    last_update_time: number
  }
}

export interface AccountRCRpcResponse extends RPCResponse {
  result: {
    rc_accounts: AccountRC[]
  }
}

export interface AccountRC {
  account: string
  rc_manabar: {
    current_mana: string
    last_update_time: number
  }
  max_rc_creation_adjustment: {
    amount: string
    precision: 6
    nai: '@@000000037'
  }
  max_rc: string
  delegated_rc: string
  received_delegated_rc: string
}

export interface CoingeckoUSDPriceResponse {
  hive: {
    usd: number
    usd_market_cap: number
  }
}
