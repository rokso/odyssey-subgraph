import {
  Position as PositionContract,
  PositionOpened,
  PositionClosed,
  FeatureCalled,
} from '../../generated/templates/Position/Position'
import { EntryPoint, Position, PositionDailyData } from '../../generated/schema'
import { ADDRESS_ZERO, BIGINT_ONE, BIGINT_ZERO } from '../utils/constants'
import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { ENTRY_POINT } from '../utils/config'

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
  const positionContract = PositionContract.bind(event.address)
  position.isOutdated = positionContract.isOutdated()

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

export function handleDailyData(block: ethereum.Block): void {
  const entryPoint = EntryPoint.load(ENTRY_POINT)

  if (!entryPoint) {
    return
  }

  const smartAccounts = entryPoint.smartAccounts.load()
  for (let i = 0; i < smartAccounts.length; i++) {
    if (smartAccounts[i].positionRegistry == ADDRESS_ZERO) {
      // skip non-odyssey smartAccounts
      continue
    }
    const positions = smartAccounts[i].positions.load()
    for (let j = 0; j < positions.length; j++) {
      createOrUpdatePositionDailyData(positions[j].id, block)
    }
  }
}

export function createOrUpdatePositionDailyData(positionId: Bytes, block: ethereum.Block): void {
  const timestamp = block.timestamp.toI32()
  const dayID = timestamp / 86400 // days since unix timestamp
  const dayStartTimestamp = dayID * 86400
  const dailyDataId = positionId.toHex().concat('-').concat(dayID.toString())
  let positionDailyData = PositionDailyData.load(dailyDataId)
  if (!positionDailyData) {
    positionDailyData = new PositionDailyData(dailyDataId)
    positionDailyData.dayStartTimestamp = dayStartTimestamp
    // Read data from contract
    const positionContract = PositionContract.bind(Address.fromBytes(positionId))
    positionDailyData.pricePerShare = positionContract.pricePerShare()
    positionDailyData.position = positionId
    positionDailyData.save()
  }
}
