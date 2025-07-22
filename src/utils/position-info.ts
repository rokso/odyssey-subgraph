import { Address, BigInt } from '@graphprotocol/graph-ts'
import { Position } from '../../generated/templates/Position/Position'
import { ADDRESS_ZERO, BIG_INT_ZERO } from './constants'

export class PositionInfo {
  private contract: Position

  constructor(positionAddress: Address) {
    this.contract = Position.bind(positionAddress)
  }

  asset(): Address {
    return this.contract.asset()
  }

  borrowToken(): Address {
    const borrowToken = this.contract.try_borrowToken()
    return borrowToken.reverted ? ADDRESS_ZERO : borrowToken.value
  }

  isOutdated(): boolean {
    return this.contract.isOutdated()
  }

  pricePerShare(): BigInt {
    const pricePerShare = this.contract.try_pricePerShare()
    return pricePerShare.reverted ? BIG_INT_ZERO : pricePerShare.value
  }

  totalAllocated(): BigInt {
    const totalAllocated = this.contract.try_totalAllocated()
    return totalAllocated.reverted ? BIG_INT_ZERO : totalAllocated.value
  }

  totalDeposited(): BigInt {
    const deposited = this.contract.try_depositedAmount()
    return deposited.reverted ? BIG_INT_ZERO : deposited.value
  }

  totalBorrowed(): BigInt {
    const borrowed = this.contract.try_borrowedAmount()
    return borrowed.reverted ? BIG_INT_ZERO : borrowed.value
  }
}
