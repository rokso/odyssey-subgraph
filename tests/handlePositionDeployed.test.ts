import { newMockEvent } from 'matchstick-as'
import { assert, describe, test, clearStore, beforeAll, afterAll } from 'matchstick-as/assembly/index'
import { handlePositionDeployed } from '../src/mappings/position-registry'
import { ADDRESS_ZERO, BIGINT_ONE } from '../src/utils/constants'
import { POSITION_ADDRESS, POSITION_REGISTRY_ADDRESS, SMART_ACCOUNT_ADDRESS } from './addresses'
import { createPositionDeployedEvent, setupPositionRegistry } from './utils'

describe('PositionRegistry: PositionDeployed event', () => {
  beforeAll(() => {
    setupPositionRegistry()
    const positionDeployedEvent = createPositionDeployedEvent(SMART_ACCOUNT_ADDRESS, BIGINT_ONE, POSITION_ADDRESS)
    handlePositionDeployed(positionDeployedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test('Position is deployed', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    assert.entityCount('Position', 1)
    assert.fieldEquals(entityType, id, 'owner', SMART_ACCOUNT_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'strategyId', BIGINT_ONE.toString())
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
    assert.entityCount('PositionRegistry', 1)
    assert.fieldEquals(entityType, id, 'positionCount', BIGINT_ONE.toString())
  })

  test('SmartAccount is created', () => {
    const entityType = 'SmartAccount'
    const id = SMART_ACCOUNT_ADDRESS.toHex()
    assert.entityCount('SmartAccount', 1)
    assert.fieldEquals(entityType, id, 'positionCount', BIGINT_ONE.toString())
  })
})
