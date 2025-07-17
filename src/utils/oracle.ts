import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { MASTER_ORACLE } from '../utils/address'
import { MasterOracle } from '../../generated/templates/Position/MasterOracle'

export function quoteTokenToUsd(token: Bytes, amount: BigInt): BigInt {
  const oracle: MasterOracle = MasterOracle.bind(MASTER_ORACLE)
  return oracle.quoteTokenToUsd(Address.fromBytes(token), amount)
}
