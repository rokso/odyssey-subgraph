import { BigInt } from '@graphprotocol/graph-ts'
import {
  Position,
  PositionDailyData,
  PositionRegistry,
  PositionRegistryDailyData,
  SmartAccount,
  SmartAccountDailyData,
} from '../../generated/schema'
import { BIG_DECIMAL_ZERO, BIG_INT_ZERO } from './constants'
import { POSITION_REGISTRY } from './address'
import { quoteTokenToUsd } from './oracle'

function loadOrCreateRegistryDailyData(
  positionRegistry: PositionRegistry,
  dayID: i32,
  dayStartTimestamp: i32,
  blockTimestamp: BigInt,
): PositionRegistryDailyData {
  const dailyDataId = positionRegistry.id.toHex().concat('-').concat(dayID.toString())
  let dailyData = PositionRegistryDailyData.load(dailyDataId)
  if (!dailyData) {
    dailyData = new PositionRegistryDailyData(dailyDataId)
    dailyData.dayStartTimestamp = dayStartTimestamp
    dailyData.blockTimestamp = blockTimestamp
    dailyData.positionCount = positionRegistry.positionCount
    dailyData.smartAccountCount = positionRegistry.smartAccountCount
    dailyData.totalDepositedUSD = BIG_DECIMAL_ZERO
    dailyData.positionRegistry = positionRegistry.id
    dailyData.save()
  }
  return dailyData
}

function loadOrCreateSmartAccountDailyData(
  smartAccount: SmartAccount,
  dayID: i32,
  dayStartTimestamp: i32,
  blockTimestamp: BigInt,
): SmartAccountDailyData {
  const dailyDataId = smartAccount.id.toHex().concat('-').concat(dayID.toString())
  let dailyData = SmartAccountDailyData.load(dailyDataId)
  if (!dailyData) {
    dailyData = new SmartAccountDailyData(dailyDataId)
    dailyData.dayStartTimestamp = dayStartTimestamp
    dailyData.blockTimestamp = blockTimestamp
    dailyData.totalDepositedUSD = BIG_DECIMAL_ZERO
    dailyData.smartAccount = smartAccount.id
    dailyData.save()
  }
  return dailyData
}

function updatePositionDailyData(
  position: Position,
  dayID: i32,
  dayStartTimestamp: i32,
  blockTimestamp: BigInt,
): PositionDailyData | null {
  // Position never opened or position is closed
  if (position.openedAt.equals(BIG_INT_ZERO) || position.closedAt.gt(BIG_INT_ZERO)) return null

  if (position.totalDeposited.equals(BIG_INT_ZERO)) return null

  const dailyDataId = position.id.toHex().concat('-').concat(dayID.toString())
  let positionDailyData = PositionDailyData.load(dailyDataId)
  if (!positionDailyData) {
    positionDailyData = new PositionDailyData(dailyDataId)
    positionDailyData.dayStartTimestamp = dayStartTimestamp
    positionDailyData.blockTimestamp = blockTimestamp
    positionDailyData.pricePerShare = position.pricePerShare
    positionDailyData.totalDeposited = position.totalDeposited
    positionDailyData.totalDepositedUSD = quoteTokenToUsd(position.asset, position.totalDeposited)
    positionDailyData.position = position.id
    positionDailyData.save()
  }
  return positionDailyData
}

function updateSmartAccountDailyData(
  smartAccount: SmartAccount,
  dayID: i32,
  dayStartTimestamp: i32,
  blockTimestamp: BigInt,
): SmartAccountDailyData {
  let saDailyData = loadOrCreateSmartAccountDailyData(smartAccount, dayID, dayStartTimestamp, blockTimestamp)
  let totalDepositedUSD = BIG_DECIMAL_ZERO

  const positions = smartAccount.positions.load()
  for (let j = 0; j < positions.length; j++) {
    const position = Position.load(positions[j].id)
    if (!position) continue

    const positionDailyData = updatePositionDailyData(position, dayID, dayStartTimestamp, blockTimestamp)
    if (positionDailyData) {
      totalDepositedUSD = totalDepositedUSD.plus(positionDailyData.totalDepositedUSD)
    }
  }

  saDailyData.totalDepositedUSD = totalDepositedUSD
  saDailyData.save()
  return saDailyData
}

function updateRegistryDailyData(
  positionRegistry: PositionRegistry,
  dayID: i32,
  dayStartTimestamp: i32,
  blockTimestamp: BigInt,
): void {
  let prDailyData = loadOrCreateRegistryDailyData(positionRegistry, dayID, dayStartTimestamp, blockTimestamp)
  let totalDepositedUSD = BIG_DECIMAL_ZERO

  const smartAccounts = positionRegistry.smartAccounts.load()
  for (let i = 0; i < smartAccounts.length; i++) {
    const smartAccount = SmartAccount.load(smartAccounts[i].id)
    if (!smartAccount) continue

    const saDailyData = updateSmartAccountDailyData(smartAccount, dayID, dayStartTimestamp, blockTimestamp)
    totalDepositedUSD = totalDepositedUSD.plus(saDailyData.totalDepositedUSD)
  }

  prDailyData.totalDepositedUSD = totalDepositedUSD
  prDailyData.save()
}

export function updateDailyData(blockTimestamp: BigInt): void {
  const positionRegistry = PositionRegistry.load(POSITION_REGISTRY)
  if (!positionRegistry || positionRegistry.positionCount.equals(BIG_INT_ZERO)) return

  // TODO fix this to use BigInt or at least I64
  const timestamp = blockTimestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400

  updateRegistryDailyData(positionRegistry, dayID, dayStartTimestamp, blockTimestamp)
}
