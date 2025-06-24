import { createMockedFunction, newMockEvent } from 'matchstick-as'
import { assert, describe, test, clearStore, afterAll } from 'matchstick-as/assembly/index'
import { ethereum, BigInt } from '@graphprotocol/graph-ts'
import { ASSET_ADDRESS, MASTER_ORACLE_ADDRESS, POSITION_ADDRESS } from './utils/addresses'
import { openPosition } from './utils/setup'
import { handleDailyData } from '../src/mappings/position-registry'

describe('Daily Data: polling block handler', () => {
  afterAll(() => {
    clearStore()
  })

  test('Handle daily data', () => {
    const entityType = 'PositionDailyData'
    // positionAddress-dayId. for tests it is '00000000000000000000000000000000000005-0'
    const id = POSITION_ADDRESS.toHex().concat('-0')

    const totalAllocated = BigInt.fromI32(1000)
    const pricePerShare = BigInt.fromI32(121)
    const isOutdated = true
    openPosition(totalAllocated, pricePerShare, isOutdated)

    const mockTotalDepositedUSD = BigInt.fromI32(10)
    createMockedFunction(MASTER_ORACLE_ADDRESS, 'quoteTokenToUsd', 'quoteTokenToUsd(address,uint256):(uint256)')
      .withArgs([ethereum.Value.fromAddress(ASSET_ADDRESS), ethereum.Value.fromUnsignedBigInt(totalAllocated)])
      .returns([ethereum.Value.fromUnsignedBigInt(mockTotalDepositedUSD)])
    handleDailyData(newMockEvent().block)

    assert.entityCount(entityType, 1)
    assert.fieldEquals(entityType, id, 'totalAllocated', totalAllocated.toString())
    assert.fieldEquals(entityType, id, 'totalDepositedUSD', mockTotalDepositedUSD.toString())
    assert.fieldEquals(entityType, id, 'pricePerShare', pricePerShare.toString())
  })
})
