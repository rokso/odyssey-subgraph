import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { MASTER_ORACLE } from '../utils/address'
import { MasterOracle } from '../../generated/templates/Position/MasterOracle'
import { BIG_DECIMAL_18 } from './constants'

export function quoteTokenToUsd(token: Bytes, amount: BigInt): BigDecimal {
  const oracle: MasterOracle = MasterOracle.bind(MASTER_ORACLE)
  const quote = oracle.quoteTokenToUsd(Address.fromBytes(token), amount)
  return quote.toBigDecimal().div(BIG_DECIMAL_18)
}
