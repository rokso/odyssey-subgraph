import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ERC20, Transfer } from '../../generated/ERC20/ERC20'
import { Account, Token, Balance } from '../../generated/schema'

// TODO: WIP testing out best way to index from non zero blocks
// handle token entity
function handleToken(event: ethereum.Event): Token | null {
  let token = Token.load(event.address)
  if (!token) {
    // bind address to call contract method
    const erc20 = ERC20.bind(event.address)

    const nameResult = erc20.try_name()
    if (nameResult.reverted) {
      return null
    }

    const symbolResult = erc20.try_symbol()
    if (symbolResult.reverted) {
      return null
    }

    const decimalsResult = erc20.try_decimals()
    if (decimalsResult.reverted) {
      return null
    }

    token = new Token(event.address)
    token.name = nameResult.value
    token.symbol = symbolResult.value
    token.decimals = decimalsResult.value
    token.save()
  }
  return token
}

// handle account entity
function handleAccount(id: Address): Account {
  let account = Account.load(id)
  if (!account) {
    account = new Account(id)
    account.save()
  }
  return account as Account
}

function balanceOf(token: Token, account: Account): BigInt {
  const balanceResult = ERC20.bind(Address.fromBytes(token.id)).try_balanceOf(Address.fromBytes(account.id))
  if (balanceResult.reverted) {
    return BigInt.fromI32(0)
  }
  return balanceResult.value
}

// handle balance entity
function handleBalance(token: Token, account: Account): Balance {
  let balance = Balance.load(token.id.concat(account.id))
  if (!balance) {
    balance = new Balance(token.id.concat(account.id))
    balance.token = token.id
    balance.account = account.id
  }
  // if we index from 0 block then we can keep accounting of the balance.
  // We are NOT indexing from 0 block so we need to read balance from contract.
  balance.value = balanceOf(token, account)
  balance.save()
  return balance as Balance
}

// handle transfer event
export function handleTransfer(event: Transfer): void {
  const token = handleToken(event)
  if (!token) {
    return
  }

  const fromAccount = handleAccount(event.params.from)
  const toAccount = handleAccount(event.params.to)

  handleBalance(token, fromAccount)
  handleBalance(token, toAccount)
}
