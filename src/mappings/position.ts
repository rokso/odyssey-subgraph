import { PositionOpened, PositionClosed, FeatureCalled } from '../../generated/templates/Position/Position'
import { Position } from '../../generated/schema'
import { ADDRESS_ZERO, BIGINT_ONE, BIGINT_ZERO } from '../utils/constants'
import { PositionInfo } from '../utils/position-info'
import { updateDailyData } from '../utils/data-handler'
import { quoteTokenToUsd } from '../utils/oracle'

export function handlePositionOpened(event: PositionOpened): void {
  const position = Position.load(event.address)!
  position.openedAt = event.block.timestamp
  position.closedAt = BIGINT_ZERO // in case we are reusing position
  position.txCount = position.txCount.plus(BIGINT_ONE)
  position.totalAllocated = event.params.pushed
  position.asset = event.params.asset

  const info = new PositionInfo(event.address)
  position.borrowToken = info.borrowToken()
  position.pricePerShare = info.pricePerShare()
  position.totalDeposited = info.totalDeposited()
  position.totalDepositedUSD = quoteTokenToUsd(position.asset, position.totalDeposited)
  position.totalBorrowed = info.totalBorrowed()
  position.isOutdated = info.isOutdated()

  position.save()

  updateDailyData(event.block.timestamp)
}

export function handlePositionClosed(event: PositionClosed): void {
  const position = Position.load(event.address)!
  position.totalAllocated = event.params.pulled
  position.closedAt = event.block.timestamp
  position.txCount = BIGINT_ZERO
  position.asset = ADDRESS_ZERO
  position.borrowToken = ADDRESS_ZERO
  position.pricePerShare = BIGINT_ZERO
  position.totalDeposited = BIGINT_ZERO
  position.totalDepositedUSD = BIGINT_ZERO
  position.totalBorrowed = BIGINT_ZERO

  const info = new PositionInfo(event.address)
  position.isOutdated = info.isOutdated()

  position.save()

  updateDailyData(event.block.timestamp)
}

export function handleFeatureCalled(event: FeatureCalled): void {
  const position = Position.load(event.address)!
  position.txCount = position.txCount.plus(BIGINT_ONE)
  position.totalAllocated = event.params.allocatedAfter

  const info = new PositionInfo(event.address)
  position.pricePerShare = info.pricePerShare()
  position.totalDeposited = info.totalDeposited()
  position.totalDepositedUSD = quoteTokenToUsd(position.asset, position.totalDeposited)
  position.totalBorrowed = info.totalBorrowed()
  position.isOutdated = info.isOutdated()

  position.save()

  updateDailyData(event.block.timestamp)
}
