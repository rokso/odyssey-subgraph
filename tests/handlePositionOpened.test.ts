import { newMockEventWithParams } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { BigInt } from '@graphprotocol/graph-ts'
import { ASSET_ADDRESS, POSITION_ADDRESS } from './utils/addresses'
import { openPosition } from './utils/setup'

describe('Position: PositionOpened event', () => {
  afterAll(() => {
    clearStore()
  })

  test('Position is opened', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    const totalAllocated = BigInt.fromI32(1000)
    const mockPricePerShare = BigInt.fromI32(121)
    const mockIsOutdated = true
    openPosition(totalAllocated, mockPricePerShare, mockIsOutdated)

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'asset', ASSET_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'totalAllocated', BigInt.fromI32(1000).toString())
    assert.fieldEquals(entityType, id, 'pricePerShare', mockPricePerShare.toString())
    assert.fieldEquals(entityType, id, 'isOutdated', mockIsOutdated.toString())
    assert.fieldEquals(entityType, id, 'txCount', '1')
    assert.fieldEquals(entityType, id, 'openedAt', newMockEventWithParams([]).block.timestamp.toString())
  })
})
