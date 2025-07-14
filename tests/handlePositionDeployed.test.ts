import { newMockEvent } from 'matchstick-as'
import { assert, describe, test, clearStore, beforeAll, afterAll } from 'matchstick-as/assembly/index'
import { ADDRESS_ZERO, POSITION_ADDRESS, POSITION_REGISTRY_ADDRESS, SMART_ACCOUNT_ADDRESS } from './utils/addresses'
import { deployPosition } from './utils/setup'

describe('PositionRegistry: PositionDeployed event', () => {
  beforeAll(() => {
    deployPosition()
  })

  afterAll(() => {
    clearStore()
  })

  test('Position is deployed', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    assert.entityCount(entityType, 1)
    assert.entityCount('PositionRegistry', 1)
    assert.fieldEquals(entityType, id, 'owner', SMART_ACCOUNT_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'strategyId', '1')
    assert.fieldEquals(entityType, id, 'createdAt', newMockEvent().block.timestamp.toString())
    assert.fieldEquals(entityType, id, 'openedAt', '0')
    assert.fieldEquals(entityType, id, 'txCount', '0')
    assert.fieldEquals(entityType, id, 'totalAllocated', '0')
    assert.fieldEquals(entityType, id, 'pricePerShare', '0')
    assert.fieldEquals(entityType, id, 'asset', ADDRESS_ZERO.toHex())
    assert.fieldEquals(entityType, id, 'isOutdated', 'false')
  })

  test('PositionCount in PositionRegistry is updated', () => {
    const entityType = 'PositionRegistry'
    const id = POSITION_REGISTRY_ADDRESS.toHex()
    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'positionCount', '1')
  })

  test('SmartAccount is updated', () => {
    const entityType = 'SmartAccount'
    const id = SMART_ACCOUNT_ADDRESS.toHex()
    assert.entityCount(entityType, 1)
    assert.entityCount('PositionRegistry', 1)
    assert.fieldEquals(entityType, id, 'positionCount', '1')
    assert.fieldEquals(entityType, id, 'positionRegistry', POSITION_REGISTRY_ADDRESS.toHex())
  })
})
