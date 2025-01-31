import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { OwnershipTransferred, PositionDeployed } from '../../generated/PositionRegistry/PositionRegistry'
import { createMockedFunction, newMockEvent } from 'matchstick-as'
import {
  ADDRESS_ZERO,
  ASSET_ADDRESS,
  ENTRY_POINT_ADDRESS,
  FAKE_ADDRESS,
  FEE_COLLECTOR_ADDRESS,
  POSITION_ADDRESS,
  POSITION_REGISTRY_ADDRESS,
  SAFE_ADDRESS,
  SMART_ACCOUNT_ADDRESS,
} from './addresses'
import { handleOwnershipTransferred, handlePositionDeployed } from '../../src/mappings/position-registry'
import { PositionOpened } from '../../generated/templates/Position/Position'
import { handlePositionOpened } from '../../src/mappings/position'
import { AccountDeployed } from '../../generated/EntryPoint/EntryPoint'
import { handleAccountDeployed } from '../../src/mappings/entry-point'

export function createAccountDeployedEvent(smartAccount: Address): AccountDeployed {
  const event = changetype<AccountDeployed>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('userOpHash', ethereum.Value.fromBytes(Bytes.fromI32(0))))
  event.parameters.push(new ethereum.EventParam('sender', ethereum.Value.fromAddress(smartAccount)))
  event.parameters.push(new ethereum.EventParam('factory', ethereum.Value.fromAddress(FAKE_ADDRESS)))
  event.parameters.push(new ethereum.EventParam('paymaster', ethereum.Value.fromAddress(FAKE_ADDRESS)))

  event.address = ENTRY_POINT_ADDRESS
  return event
}

export function createPositionDeployedEvent(owner: Address, strategyId: BigInt, position: Address): PositionDeployed {
  const event = changetype<PositionDeployed>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('owner', ethereum.Value.fromAddress(owner)))
  event.parameters.push(new ethereum.EventParam('strategyId', ethereum.Value.fromUnsignedBigInt(strategyId)))
  event.parameters.push(new ethereum.EventParam('position', ethereum.Value.fromAddress(position)))

  event.address = POSITION_REGISTRY_ADDRESS
  return event
}

export function createOwnershipTransferredEvent(previousOwner: Address, newOwner: Address): OwnershipTransferred {
  const event = changetype<OwnershipTransferred>(newMockEvent())

  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('previousOwner', ethereum.Value.fromAddress(previousOwner)))
  event.parameters.push(new ethereum.EventParam('newOwner', ethereum.Value.fromAddress(newOwner)))

  event.address = POSITION_REGISTRY_ADDRESS
  return event
}

export function createPositionOpenedEvent(asset: Address, totalAllocated: BigInt): PositionOpened {
  const event = changetype<PositionOpened>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam('asset', ethereum.Value.fromAddress(asset)))
  event.parameters.push(new ethereum.EventParam('totalAllocated', ethereum.Value.fromUnsignedBigInt(totalAllocated)))

  event.address = POSITION_ADDRESS
  return event
}

export function setupPositionRegistry(): void {
  createMockedFunction(POSITION_REGISTRY_ADDRESS, 'feeCollector', 'feeCollector():(address)').returns([
    ethereum.Value.fromAddress(FEE_COLLECTOR_ADDRESS),
  ])
  handleOwnershipTransferred(createOwnershipTransferredEvent(ADDRESS_ZERO, SAFE_ADDRESS))
}

export function setupSmartAccount(): void {
  handleAccountDeployed(createAccountDeployedEvent(SMART_ACCOUNT_ADDRESS))
}

export function deployPosition(): void {
  setupPositionRegistry()
  setupSmartAccount()
  handlePositionDeployed(createPositionDeployedEvent(SMART_ACCOUNT_ADDRESS, BigInt.fromI32(1), POSITION_ADDRESS))
}

export function openPosition(totalAllocated: BigInt, mockPricePerShare: BigInt, mockIsOutdated: boolean): void {
  deployPosition()
  handlePositionDeployed(createPositionDeployedEvent(SMART_ACCOUNT_ADDRESS, BigInt.fromI32(1), POSITION_ADDRESS))

  createMockedFunction(POSITION_ADDRESS, 'pricePerShare', 'pricePerShare():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(mockPricePerShare),
  ])
  createMockedFunction(POSITION_ADDRESS, 'isOutdated', 'isOutdated():(bool)').returns([
    ethereum.Value.fromBoolean(mockIsOutdated),
  ])

  handlePositionOpened(createPositionOpenedEvent(ASSET_ADDRESS, totalAllocated))
}
