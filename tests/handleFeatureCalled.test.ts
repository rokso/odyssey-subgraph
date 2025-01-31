import { newMockEvent, newMockEventWithParams } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, BigInt } from '@graphprotocol/graph-ts'
import { ASSET_ADDRESS, POSITION_ADDRESS } from './utils/addresses'
import { FeatureCalled } from '../generated/templates/Position/Position'
import { handleFeatureCalled } from '../src/mappings/position'
import { openPosition } from './utils/setup'

function createFeatureCalledEvent(allocatedBefore: BigInt, allocatedAfter: BigInt): FeatureCalled {
  const event = changetype<FeatureCalled>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('allocatedBefore', ethereum.Value.fromUnsignedBigInt(allocatedBefore)))
  event.parameters.push(new ethereum.EventParam('allocatedAfter', ethereum.Value.fromUnsignedBigInt(allocatedAfter)))

  event.address = POSITION_ADDRESS
  return event
}

function featureCalledEvent(): void {
  const allocatedBefore = BigInt.fromI32(1000)
  const allocatedAfter = BigInt.fromI32(1500)
  const featureCalledEvent = createFeatureCalledEvent(allocatedBefore, allocatedAfter)
  handleFeatureCalled(featureCalledEvent)
}

describe('Position: FeatureCalled event', () => {
  afterAll(() => {
    clearStore()
  })

  test('Feature is called', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    const mockPricePerShare = BigInt.fromI32(121)
    const mockIsOutdated = true
    openPosition(BigInt.fromI32(1000), mockPricePerShare, mockIsOutdated)
    featureCalledEvent()

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'asset', ASSET_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'totalAllocated', BigInt.fromI32(1500).toString())
    assert.fieldEquals(entityType, id, 'isOutdated', mockIsOutdated.toString())
    assert.fieldEquals(entityType, id, 'pricePerShare', mockPricePerShare.toString())
    assert.fieldEquals(entityType, id, 'txCount', '2')
    assert.fieldEquals(entityType, id, 'openedAt', newMockEventWithParams([]).block.timestamp.toString())
  })
})
