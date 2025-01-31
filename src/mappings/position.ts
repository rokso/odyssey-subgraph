import {
  Position as PositionContract,
  PositionOpened,
  PositionClosed,
  FeatureCalled,
} from '../../generated/templates/Position/Position'
import { Position } from '../../generated/schema'
import { ADDRESS_ZERO, BIGINT_ONE, BIGINT_ZERO } from '../utils/constants'
import { Bytes } from '@graphprotocol/graph-ts'

export function handlePositionOpened(event: PositionOpened): void {
  const position = Position.load(event.address)!
  position.openedAt = event.block.timestamp
  position.txCount = position.txCount.plus(BIGINT_ONE)
  position.totalAllocated = event.params.pushed
  position.asset = event.params.asset
  // Read data from contract
  const positionContract = PositionContract.bind(event.address)
  position.pricePerShare = positionContract.pricePerShare()
  position.isOutdated = positionContract.isOutdated()

  position.save()
}

export function handlePositionClosed(event: PositionClosed): void {
  const position = Position.load(event.address)!
  position.totalAllocated = event.params.pulled
  position.openedAt = BIGINT_ZERO
  position.txCount = BIGINT_ZERO
  position.asset = ADDRESS_ZERO
  position.pricePerShare = BIGINT_ZERO

  position.save()
}

export function handleFeatureCalled(event: FeatureCalled): void {
  const position = Position.load(event.address)!
  position.txCount = position.txCount.plus(BIGINT_ONE)
  position.totalAllocated = event.params.allocatedAfter
  // Read data from contract
  const positionContract = PositionContract.bind(event.address)
  position.pricePerShare = positionContract.pricePerShare()
  position.isOutdated = positionContract.isOutdated()

  position.save()
}
