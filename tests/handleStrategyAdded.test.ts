import { newMockEvent } from 'matchstick-as'
import { assert, describe, test, clearStore, beforeAll, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts'
import { handleStrategyAdded } from '../src/mappings/position-registry'
import { StrategyAdded } from '../generated/PositionRegistry/PositionRegistry'
import { FEE_POLICY_ADDRESS, POSITION_REGISTRY_ADDRESS, STRATEGY_ADDRESS } from './addresses'

function createStrategyAddedEvent(strategyId: BigInt, implementation: Address, feePolicy: Address): StrategyAdded {
  let strategyAddedEvent = changetype<StrategyAdded>(newMockEvent())

  strategyAddedEvent.parameters = new Array()

  strategyAddedEvent.parameters.push(
    new ethereum.EventParam('strategyId', ethereum.Value.fromUnsignedBigInt(strategyId)),
  )
  strategyAddedEvent.parameters.push(
    new ethereum.EventParam('implementation', ethereum.Value.fromAddress(implementation)),
  )
  strategyAddedEvent.parameters.push(new ethereum.EventParam('feePolicy', ethereum.Value.fromAddress(feePolicy)))

  return strategyAddedEvent
}

describe('PositionRegistry: StrategyAdded event', () => {
  beforeAll(() => {
    const strategyId = BigInt.fromI64(1)
    const strategyAddedEvent = createStrategyAddedEvent(strategyId, STRATEGY_ADDRESS, FEE_POLICY_ADDRESS)
    strategyAddedEvent.address = POSITION_REGISTRY_ADDRESS
    handleStrategyAdded(strategyAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test('Strategy is added', () => {
    const entityType = 'Strategy'
    const id = BigInt.fromI64(1).toString()
    assert.entityCount('Strategy', 1)
    assert.fieldEquals(entityType, id, 'implementation', STRATEGY_ADDRESS.toHexString())
    assert.fieldEquals(entityType, id, 'feePolicy', FEE_POLICY_ADDRESS.toHexString())
    assert.fieldEquals(entityType, id, 'isActive', 'true')
  })
})
