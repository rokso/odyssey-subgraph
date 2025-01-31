import { handleTransfer } from '../src/mappings/token'
import { Transfer } from '../generated/ERC20/ERC20'
import { test, assert, newMockEvent, describe, createMockedFunction } from 'matchstick-as/assembly/index'
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ADDRESS_ONE, ADDRESS_THREE, ADDRESS_TWO } from './constants'

function createTransferEvent(from: Address, to: Address, value: BigInt): Transfer {
  const transferEvent = changetype<Transfer>(newMockEvent())
  transferEvent.parameters = new Array()

  const fromParam = new ethereum.EventParam('from', ethereum.Value.fromAddress(from))
  const toParam = new ethereum.EventParam('to', ethereum.Value.fromAddress(to))
  // mapping is ignoring value parameter
  const valueParam = new ethereum.EventParam('value', ethereum.Value.fromUnsignedBigInt(value))

  transferEvent.parameters.push(fromParam)
  transferEvent.parameters.push(toParam)
  transferEvent.parameters.push(valueParam)

  return transferEvent
}

function mockTokenMetadata(token: Address): void {
  const name = ethereum.Value.fromString('Test Token')
  const symbol = ethereum.Value.fromString('TST')
  const decimals = ethereum.Value.fromI32(18)
  createMockedFunction(token, 'name', 'name():(string)').returns([name])
  createMockedFunction(token, 'symbol', 'symbol():(string)').returns([symbol])
  createMockedFunction(token, 'decimals', 'decimals():(uint256)').returns([decimals])
}

function mockBalanceOf(token: Address, fromAddress: Address, value: BigInt): void {
  createMockedFunction(token, 'balanceOf', 'balanceOf(address):(uint256)')
    .withArgs([ethereum.Value.fromAddress(fromAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(value)])
}

describe('ERC20: Transfer event', () => {
  test('handleTransfer creates and updates entities correctly', () => {
    const token = ADDRESS_ONE
    const fromAddress = ADDRESS_TWO
    const toAddress = ADDRESS_THREE
    const fromBalance = 1000
    const toBalance = 500

    mockTokenMetadata(token)
    mockBalanceOf(token, fromAddress, BigInt.fromI32(fromBalance))
    mockBalanceOf(token, toAddress, BigInt.fromI32(toBalance))

    const transferEvent = createTransferEvent(fromAddress, toAddress, BigInt.fromI32(toBalance))
    transferEvent.address = token
    handleTransfer(transferEvent)

    assert.entityCount('Token', 1)
    assert.entityCount('Account', 2)
    assert.entityCount('Balance', 2)
    const id = token.concat(fromAddress).toHex()
    assert.fieldEquals('Balance', id, 'value', fromBalance.toString())

    const id2 = token.concat(toAddress).toHex()
    assert.fieldEquals('Balance', id2, 'value', toBalance.toString())
  })
})
