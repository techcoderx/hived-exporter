import { Account, AccountRC } from './types.js'

export const thousandSeperator = (num: number | bigint | string): string => {
  const num_parts = num.toString().split('.')
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return num_parts.join('.')
}

export const computeCurrentVests = (account: Account) => {
  let vests = parseFloat(account.vesting_shares)
  const vests_delegated = parseFloat(account.delegated_vesting_shares)
  const vests_received = parseFloat(account.received_vesting_shares)
  const withdraw_rate = parseFloat(account.vesting_withdraw_rate)
  const already_withdrawn = (Number(account.to_withdraw) - Number(account.withdrawn)) / 1000000
  const withdraw_vests = Math.min(withdraw_rate, already_withdrawn)
  vests = vests - withdraw_vests - vests_delegated + vests_received

  return vests
}

const calculateManabar = (max_mana: number, { current_mana, last_update_time }: { current_mana: string | number; last_update_time: number }) => {
  const delta: number = Date.now() / 1000 - last_update_time
  if (typeof current_mana === 'string') {
    current_mana = parseInt(current_mana)
  }
  current_mana = current_mana + (delta * max_mana) / 432000
  let percentage: number = Math.round((current_mana / max_mana) * 10000)

  if (!isFinite(percentage) || percentage < 0) {
    percentage = 0
  } else if (percentage > 10000) {
    percentage = 10000
  }

  return { current_mana, max_mana, percentage }
}

export const computeVPMana = (account: Account, isDownvote: boolean) => {
  let max_mana: number = computeCurrentVests(account) * Math.pow(10, 6)
  if (isDownvote) {
    max_mana = Math.round(max_mana / 4)
  }
  return calculateManabar(max_mana, isDownvote ? account.downvote_manabar : account.voting_manabar)
}

export const computeRCMana = (rc_account: AccountRC) => {
  return calculateManabar(parseInt(rc_account.max_rc), rc_account.rc_manabar)
}
