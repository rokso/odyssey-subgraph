import { assert, describe, test, clearStore } from 'matchstick-as/assembly/index'
import { ADDRESS_ZERO, SMART_ACCOUNT_ADDRESS } from './utils/addresses'
import { createAccountDeployedEvent } from './utils/setup'
import { handleAccountDeployed } from '../src/mappings/entry-point'

describe('EntryPoint: AccountDeployed event', () => {
  test('Smart Account is deployed', () => {
    handleAccountDeployed(createAccountDeployedEvent(SMART_ACCOUNT_ADDRESS))

    const entityType = 'SmartAccount'
    const id = SMART_ACCOUNT_ADDRESS.toHex()

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'positionRegistry', ADDRESS_ZERO.toHex())

    clearStore()
  })
})
