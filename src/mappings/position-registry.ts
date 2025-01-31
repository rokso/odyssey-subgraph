import { log } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  PositionDeployed as PositionDeployedEvent,
  StrategyAdded as StrategyAddedEvent,
  PositionRegistry as PositionRegistryContract,
} from '../../generated/PositionRegistry/PositionRegistry'
import { PositionRegistry, Position, Strategy, SmartAccount } from '../../generated/schema'
import { Position as PositionTemplate } from '../../generated/templates'
import { ADDRESS_ZERO, BIGINT_ONE, BIGINT_ZERO } from '../utils/constants'

export function handlePositionDeployed(event: PositionDeployedEvent): void {
  // at this point we know that positionRegistry is initialized
  const registry = PositionRegistry.load(event.address)!

  // load or create new smartAccount entity
  const smartAccountId = event.params.owner
  let smartAccount = SmartAccount.load(smartAccountId)
  if (!smartAccount) {
    smartAccount = new SmartAccount(smartAccountId)
    smartAccount.positionCount = BIGINT_ZERO
    smartAccount.positionRegistry = registry.id
    registry.smartAccountCount = registry.smartAccountCount.plus(BIGINT_ONE)
  }

  // create new position entity
  const position = new Position(event.params.position)
  position.owner = smartAccount.id
  position.strategyId = event.params.strategyId
  position.createdAt = event.block.timestamp
  position.openedAt = BIGINT_ZERO
  position.txCount = BIGINT_ZERO
  position.totalAllocated = BIGINT_ZERO
  position.pricePerShare = BIGINT_ZERO
  position.asset = ADDRESS_ZERO
  position.isOutdated = false

  smartAccount.positionCount = smartAccount.positionCount.plus(BIGINT_ONE)

  registry.positionCount = registry.positionCount.plus(BIGINT_ONE)

  position.save()
  // create new datasource for the position
  PositionTemplate.create(event.params.position)

  smartAccount.save()
  registry.save()
}

export function handleStrategyAdded(event: StrategyAddedEvent): void {
  const strategy = new Strategy(event.params.strategyId.toString())
  strategy.implementation = event.params.implementation
  strategy.feePolicy = event.params.feePolicy
  strategy.isActive = true
  strategy.save()
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let positionRegistry = PositionRegistry.load(event.address)
  if (!positionRegistry) {
    positionRegistry = new PositionRegistry(event.address)
    // when position registry is initialized, previousOwner will be AddressZero.
    // In this case, we need to set the feeCollector and positionCount.
    if (event.params.previousOwner == ADDRESS_ZERO) {
      positionRegistry.feeCollector = PositionRegistryContract.bind(event.address).feeCollector()
      positionRegistry.positionCount = BIGINT_ZERO
      positionRegistry.smartAccountCount = BIGINT_ZERO
    }
  }
  // update the owner
  positionRegistry.owner = event.params.newOwner
  positionRegistry.save()
}
