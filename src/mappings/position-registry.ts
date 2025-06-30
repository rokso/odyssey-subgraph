import { Address, ethereum } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  PositionDeployed as PositionDeployedEvent,
  StrategyAdded as StrategyAddedEvent,
  PositionRegistry as PositionRegistryContract,
  IsActiveUpdated,
  FeeCollectorUpdated,
  FeePolicyUpdated,
  ImplementationUpdated,
} from '../../generated/PositionRegistry/PositionRegistry'
import { MasterOracle } from '../../generated/PositionRegistry/MasterOracle'
import {
  PositionRegistry,
  Position,
  Strategy,
  SmartAccount,
  PositionDailyData,
  PositionRegistryDailyData,
  SmartAccountDailyData,
} from '../../generated/schema'
import { Position as PositionTemplate } from '../../generated/templates'
import { ADDRESS_ZERO, BIGINT_ONE, BIGINT_ZERO } from '../utils/constants'
import { MASTER_ORACLE, POSITION_REGISTRY } from '../utils/address'
import { PositionInfo } from '../utils/position-info'

export function loadOrCreateSmartAccount(id: Address): SmartAccount {
  let smartAccount = SmartAccount.load(id)
  if (!smartAccount) {
    smartAccount = new SmartAccount(id)
    smartAccount.positionCount = BIGINT_ZERO
    smartAccount.positionRegistry = ADDRESS_ZERO // set default value
    smartAccount.save()
  }
  return smartAccount
}

export function handlePositionDeployed(event: PositionDeployedEvent): void {
  // at this point we know that positionRegistry is initialized
  const registry = PositionRegistry.load(event.address)!

  // create smartAccount entity if smartAccount is deployed before startBlock.
  // load smartAccount entity, Set PositionRegistry, this update mark smartAccount as Odyssey smartAccount.
  const smartAccount = loadOrCreateSmartAccount(event.params.owner)
  if (smartAccount.positionRegistry == ADDRESS_ZERO) {
    smartAccount.positionRegistry = registry.id
    registry.smartAccountCount = registry.smartAccountCount.plus(BIGINT_ONE)
  }

  // create new position entity
  const position = new Position(event.params.position)
  position.owner = smartAccount.id
  position.strategyId = event.params.strategyId
  position.createdAt = event.block.timestamp
  position.openedAt = BIGINT_ZERO
  position.closedAt = BIGINT_ZERO
  position.txCount = BIGINT_ZERO
  position.totalAllocated = BIGINT_ZERO
  position.pricePerShare = BIGINT_ZERO
  position.asset = ADDRESS_ZERO
  position.isOutdated = false

  smartAccount.positionCount = smartAccount.positionCount.plus(BIGINT_ONE)

  registry.positionCount = registry.positionCount.plus(BIGINT_ONE)

  // create new datasource for the position
  PositionTemplate.create(event.params.position)
  position.save()

  smartAccount.save()
  registry.save()
}

export function handleStrategyAdded(event: StrategyAddedEvent): void {
  const strategy = new Strategy(event.params.strategyId.toString())

  // at this point we know that positionRegistry is initialized
  strategy.positionRegistry = PositionRegistry.load(event.address)!.id

  strategy.implementation = event.params.implementation
  strategy.feePolicy = event.params.feePolicy
  strategy.isActive = true
  strategy.save()
}

export function handleIsActiveUpdated(event: IsActiveUpdated): void {
  const strategy = Strategy.load(event.params.strategyId.toString())!
  strategy.isActive = event.params.isActive
  strategy.save()
}

export function handleFeePolicyUpdated(event: FeePolicyUpdated): void {
  const strategy = Strategy.load(event.params.strategyId.toString())!
  strategy.feePolicy = event.params.newFeePolicy
  strategy.save()
}

export function handleImplementationUpdated(event: ImplementationUpdated): void {
  const strategy = Strategy.load(event.params.strategyId.toString())!
  strategy.implementation = event.params.newImplementation
  strategy.save()
}

// This handler will create PositionRegistry entity and also update owner.
export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let positionRegistry = PositionRegistry.load(event.address)
  if (!positionRegistry) {
    positionRegistry = new PositionRegistry(event.address)
    positionRegistry.feeCollector = PositionRegistryContract.bind(event.address).feeCollector()
    positionRegistry.positionCount = BIGINT_ZERO
    positionRegistry.smartAccountCount = BIGINT_ZERO
  }
  // update the owner
  positionRegistry.owner = event.params.newOwner
  positionRegistry.save()
}

export function handleFeeCollectorUpdated(event: FeeCollectorUpdated): void {
  const registry = PositionRegistry.load(event.address)!
  registry.feeCollector = event.params.newFeeCollector
  registry.save()
}

function loadOrCreateRegistryDailyData(
  positionRegistry: PositionRegistry,
  dayID: i32,
  dayStartTimestamp: i32,
  block: ethereum.Block,
): PositionRegistryDailyData {
  const prDailyDataId = positionRegistry.id.toHex().concat('-').concat(dayID.toString())
  let prDailyData = PositionRegistryDailyData.load(prDailyDataId)
  if (!prDailyData) {
    prDailyData = new PositionRegistryDailyData(prDailyDataId)
    prDailyData.dayStartTimestamp = dayStartTimestamp
    prDailyData.blockTimestamp = block.timestamp
    prDailyData.positionCount = positionRegistry.positionCount
    prDailyData.smartAccountCount = positionRegistry.smartAccountCount
    prDailyData.totalDepositedUSD = BIGINT_ZERO
    prDailyData.positionRegistry = positionRegistry.id
    prDailyData.save()
  }
  return prDailyData
}

function loadOrCreateSmartAccountDailyData(
  smartAccount: SmartAccount,
  dayID: i32,
  dayStartTimestamp: i32,
  block: ethereum.Block,
): SmartAccountDailyData {
  const saDailyDataId = smartAccount.id.toHex().concat('-').concat(dayID.toString())
  let saDailyData = SmartAccountDailyData.load(saDailyDataId)
  if (!saDailyData) {
    saDailyData = new SmartAccountDailyData(saDailyDataId)
    saDailyData.dayStartTimestamp = dayStartTimestamp
    saDailyData.blockTimestamp = block.timestamp
    saDailyData.totalDepositedUSD = BIGINT_ZERO
    saDailyData.smartAccount = smartAccount.id
    saDailyData.save()
  }
  return saDailyData
}

function processPositionDailyData(
  oracle: MasterOracle,
  position: Position,
  dayID: i32,
  dayStartTimestamp: i32,
  block: ethereum.Block,
): PositionDailyData | null {
  if (!position.openedAt.gt(BIGINT_ZERO) || !position.closedAt.equals(BIGINT_ZERO)) {
    return null
  }
  const info = new PositionInfo(Address.fromBytes(position.id))
  const totalDeposited = info.totalDeposited()
  if (totalDeposited.equals(BIGINT_ZERO)) {
    return null
  }
  const dailyDataId = position.id.toHex().concat('-').concat(dayID.toString())
  let positionDailyData = PositionDailyData.load(dailyDataId)
  if (!positionDailyData) {
    positionDailyData = new PositionDailyData(dailyDataId)
    positionDailyData.dayStartTimestamp = dayStartTimestamp
    positionDailyData.blockTimestamp = block.timestamp
    positionDailyData.pricePerShare = info.pricePerShare()
    positionDailyData.totalDeposited = totalDeposited
    positionDailyData.totalDepositedUSD = oracle.quoteTokenToUsd(Address.fromBytes(position.asset), totalDeposited)
    positionDailyData.position = position.id
    positionDailyData.save()
  }
  return positionDailyData
}

export function handleDailyData(block: ethereum.Block): void {
  const positionRegistry = PositionRegistry.load(POSITION_REGISTRY)
  if (!positionRegistry) {
    return
  }

  const oracle: MasterOracle = MasterOracle.bind(MASTER_ORACLE)

  const timestamp = block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400

  let prDailyData = loadOrCreateRegistryDailyData(positionRegistry, dayID, dayStartTimestamp, block)

  const smartAccounts = positionRegistry.smartAccounts.load()
  for (let i = 0; i < smartAccounts.length; i++) {
    const smartAccount = SmartAccount.load(smartAccounts[i].id)
    if (!smartAccount) {
      continue
    }

    let saDailyData = loadOrCreateSmartAccountDailyData(smartAccount, dayID, dayStartTimestamp, block)

    const positions = smartAccounts[i].positions.load()
    for (let j = 0; j < positions.length; j++) {
      const position = Position.load(positions[j].id)
      if (!position) {
        continue
      }
      const positionDailyData = processPositionDailyData(oracle, position, dayID, dayStartTimestamp, block)
      if (positionDailyData) {
        saDailyData.totalDepositedUSD = saDailyData.totalDepositedUSD.plus(positionDailyData.totalDepositedUSD)
        saDailyData.save()
      }
    }
    prDailyData.totalDepositedUSD = prDailyData.totalDepositedUSD.plus(saDailyData.totalDepositedUSD)
    prDailyData.save()
  }
}

// export function createOrUpdatePositionDailyData(oracle: MasterOracle, position: Position, block: ethereum.Block): void {
//   const info = new PositionInfo(Address.fromBytes(position.id))
//   // if deposit is zero then no need to track the data
//   const totalDeposited = info.totalDeposited()
//   if (totalDeposited.equals(BIGINT_ZERO)) {
//     return
//   }
//   // TODO fix this to use BigInt or at least I64
//   const timestamp = block.timestamp.toI32()
//   const dayID = timestamp / 86400 // days since unix timestamp
//   const dayStartTimestamp = dayID * 86400
//   const dailyDataId = position.id.toHex().concat('-').concat(dayID.toString())
//   let positionDailyData = PositionDailyData.load(dailyDataId)
//   if (!positionDailyData) {
//     positionDailyData = new PositionDailyData(dailyDataId)
//     positionDailyData.dayStartTimestamp = dayStartTimestamp
//     positionDailyData.blockTimestamp = block.timestamp

//     positionDailyData.pricePerShare = info.pricePerShare()
//     positionDailyData.totalDeposited = totalDeposited
//     positionDailyData.totalDepositedUSD = oracle.quoteTokenToUsd(Address.fromBytes(position.asset), totalDeposited)
//     positionDailyData.position = position.id

//     positionDailyData.save()
//   }
// }
