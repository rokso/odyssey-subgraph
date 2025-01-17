import { newMockEventWithParams } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts'
import { ASSET_ADDRESS, POSITION_ADDRESS } from './addresses'
import { PositionClosed } from '../generated/templates/Position/Position'
import { handlePositionClosed } from '../src/mappings/position'
import { openPosition } from './utils'
import { ADDRESS_ZERO } from '../src/utils/constants'

function createPositionClosedEvent(asset: Address, totalAllocated: BigInt): PositionClosed {
  let params: ethereum.EventParam[] = new Array()
  params.push(new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)))
  params.push(new ethereum.EventParam('totalAllocated', ethereum.Value.fromUnsignedBigInt(totalAllocated)))

  return changetype<PositionClosed>(newMockEventWithParams(params))
}

function positionClosedEvent(): void {
  const totalAllocated = BigInt.fromI32(0)
  const positionClosedEvent = createPositionClosedEvent(ASSET_ADDRESS, totalAllocated)
  positionClosedEvent.address = POSITION_ADDRESS
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

    assert.entityCount('Position', 1)
    assert.fieldEquals(entityType, id, 'asset', ADDRESS_ZERO.toHex())
    assert.fieldEquals(entityType, id, 'totalAllocated', '0')
    assert.fieldEquals(entityType, id, 'isOutdated', mockIsOutdated.toString())
    assert.fieldEquals(entityType, id, 'pricePerShare', '0')
    assert.fieldEquals(entityType, id, 'txCount', '0')
    assert.fieldEquals(entityType, id, 'openedAt', '0')
  })
})
