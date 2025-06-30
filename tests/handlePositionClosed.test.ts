import { newMockEvent } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO, ASSET_ADDRESS, POSITION_ADDRESS } from './utils/addresses'
import { PositionClosed } from '../generated/templates/Position/Position'
import { handlePositionClosed } from '../src/mappings/position'
import { openPosition } from './utils/setup'

function createPositionClosedEvent(asset: Address, totalAllocated: BigInt): PositionClosed {
  const event = changetype<PositionClosed>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)))
  event.parameters.push(new ethereum.EventParam('totalAllocated', ethereum.Value.fromUnsignedBigInt(totalAllocated)))

  event.address = POSITION_ADDRESS
  return event
}

function positionClosedEvent(): void {
  const totalAllocated = BigInt.fromI32(0)
  const positionClosedEvent = createPositionClosedEvent(ASSET_ADDRESS, totalAllocated)
  handlePositionClosed(positionClosedEvent)
}

describe('Position: PositionClosed event', () => {
  afterAll(() => {
    clearStore()
  })

  test('Position is closed', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    const mockIsOutdated = true
    openPosition(BigInt.fromI32(1000), BigInt.fromI32(121), mockIsOutdated)
    positionClosedEvent()

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'asset', ADDRESS_ZERO.toHex())
    assert.fieldEquals(entityType, id, 'totalAllocated', '0')
    assert.fieldEquals(entityType, id, 'isOutdated', mockIsOutdated.toString())
    assert.fieldEquals(entityType, id, 'pricePerShare', '0')
    assert.fieldEquals(entityType, id, 'txCount', '0')
    assert.fieldEquals(entityType, id, 'openedAt', '1')
  })
})
