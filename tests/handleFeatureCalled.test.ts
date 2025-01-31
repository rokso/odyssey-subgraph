import { createMockedFunction, newMockEventWithParams } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts'
import { ASSET_ADDRESS, POSITION_ADDRESS } from './addresses'
import { FeatureCalled, PositionOpened } from '../generated/templates/Position/Position'
import { handleFeatureCalled, handlePositionOpened } from '../src/mappings/position'
import { deployPosition } from './utils'

function createPositionOpenedEvent(asset: Address, totalAllocated: BigInt): PositionOpened {
  let params: ethereum.EventParam[] = new Array()
  params.push(new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)))
  params.push(new ethereum.EventParam('totalAllocated', ethereum.Value.fromUnsignedBigInt(totalAllocated)))

  return changetype<PositionOpened>(newMockEventWithParams(params))
}

function createFeatureCalledEvent(allocatedBefore: BigInt, allocatedAfter: BigInt): FeatureCalled {
  let params: ethereum.EventParam[] = new Array()
  params.push(new ethereum.EventParam('allocatedBefore', ethereum.Value.fromUnsignedBigInt(allocatedBefore)))
  params.push(new ethereum.EventParam('allocatedAfter', ethereum.Value.fromUnsignedBigInt(allocatedAfter)))

  return changetype<FeatureCalled>(newMockEventWithParams(params))
}

function positionOpenedEvent(): void {
  const totalAllocated = BigInt.fromI32(1000)
  const positionOpenedEvent = createPositionOpenedEvent(ASSET_ADDRESS, totalAllocated)
  positionOpenedEvent.address = POSITION_ADDRESS
  handlePositionOpened(positionOpenedEvent)
}

function featureCalledEvent(): void {
  const allocatedBefore = BigInt.fromI32(1000)
  const allocatedAfter = BigInt.fromI32(1500)
  const featureCalledEvent = createFeatureCalledEvent(allocatedBefore, allocatedAfter)
  featureCalledEvent.address = POSITION_ADDRESS
  handleFeatureCalled(featureCalledEvent)
}

describe('Position: FeatureCalled event', () => {
  afterAll(() => {
    clearStore()
  })

  test('Feature is called', () => {
    const entityType = 'Position'
    const id = POSITION_ADDRESS.toHex()

    const pricePerShare = BigInt.fromI32(121)
    createMockedFunction(POSITION_ADDRESS, 'pricePerShare', 'pricePerShare():(uint256)').returns([
      ethereum.Value.fromUnsignedBigInt(pricePerShare),
    ])

    const isOutdated = true
    createMockedFunction(POSITION_ADDRESS, 'isOutdated', 'isOutdated():(bool)').returns([
      ethereum.Value.fromBoolean(isOutdated),
    ])

    deployPosition()
    positionOpenedEvent()
    featureCalledEvent()

    assert.entityCount('Position', 1)
    assert.fieldEquals(entityType, id, 'asset', ASSET_ADDRESS.toHex())
    assert.fieldEquals(entityType, id, 'totalAllocated', BigInt.fromI32(1500).toString())
    assert.fieldEquals(entityType, id, 'isOutdated', 'true')
    assert.fieldEquals(entityType, id, 'pricePerShare', pricePerShare.toString())
    assert.fieldEquals(entityType, id, 'txCount', '2')
    assert.fieldEquals(entityType, id, 'openedAt', newMockEventWithParams([]).block.timestamp.toString())
  })
})
