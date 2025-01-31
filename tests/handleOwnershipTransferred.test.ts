import { assert, describe, test, clearStore } from 'matchstick-as/assembly/index'
import { FEE_COLLECTOR_ADDRESS, POSITION_REGISTRY_ADDRESS, SAFE_ADDRESS } from './utils/addresses'
import { setupPositionRegistry } from './utils/setup'

describe('PositionRegistry: OwnershipTransferred event', () => {
  test('PositionRegistry is created', () => {
    setupPositionRegistry()

    const entityType = 'PositionRegistry'
    const id = POSITION_REGISTRY_ADDRESS.toHex()

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'owner', SAFE_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'feeCollector', FEE_COLLECTOR_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'positionCount', '0')
    assert.fieldEquals(entityType, id, 'smartAccountCount', '0')

    clearStore()
  })
})
