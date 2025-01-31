import { Address } from '@graphprotocol/graph-ts'
import { AccountDeployed } from '../../generated/EntryPoint/EntryPoint'
import { EntryPoint, SmartAccount } from '../../generated/schema'
import { ENTRY_POINT } from '../utils/config'
import { ADDRESS_ZERO, BIGINT_ZERO } from '../utils/constants'

export function handleAccountDeployed(event: AccountDeployed): void {
  let entryPoint = EntryPoint.load(event.address)
  if (!entryPoint) {
    entryPoint = new EntryPoint(event.address)
  }
  entryPoint.save()

  // this call will always end up creating smartAccount entity and that's the goal.
  loadOrCreateSmartAccount(event.params.sender, event.address)
}

export function loadOrCreateSmartAccount(id: Address, entryPoint: Address = ENTRY_POINT): SmartAccount {
  let smartAccount = SmartAccount.load(id)
  if (!smartAccount) {
    smartAccount = new SmartAccount(id)
    smartAccount.entryPoint = entryPoint
    smartAccount.positionCount = BIGINT_ZERO
    // PositionRegistry will be updated when smartAccount deploy a position.
    smartAccount.positionRegistry = ADDRESS_ZERO
    smartAccount.save()
  }
  return smartAccount
}
