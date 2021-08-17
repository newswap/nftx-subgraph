/* eslint-disable prefer-const */
import { log, EthereumBlock, BigInt } from '@graphprotocol/graph-ts'
import { Vault, Asset, XToken } from '../types/schema'
import { NewVaultAdded, XTokenAddressSet, NftAddressSet, NegateEligibilitySet, ManagerSet, HoldingsAdded, HoldingsRemoved, IsEligibleSet, IsFinalizedSet, IsClosedSet, Is1155Set, RangeSet} from '../types/XStore/XStore'
import {
  ZERO_BD,
  ZERO_BI,
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  fetchPairToken0,
  fetchPairToken1
} from './helpers'

export function handleNewVaultAdded(event: NewVaultAdded): void {
  log.info("\n\n============LOG=======================\n\n handleNewVaultAdded vaultId={}",[event.params.vaultId.toString()])

  let vault = new Vault(event.params.vaultId.toString())

  vault.createdAtTimestamp = event.block.timestamp
  vault.createdAtBlockNumber = event.block.number
  vault.negateEligibility = true
  vault.eligibilities = []
  vault.holdings = []
  vault.isFinalized = false
  vault.isClosed = false
  vault.flipEligOnRedeem = false
  vault.is1155 = false
  vault.rangeStart = ZERO_BI
  vault.rangeEnd = ZERO_BI

  vault.save()
}

export function handleXTokenAddressSet(event: XTokenAddressSet): void {
  log.info("\n\n============LOG=======================\n\n handleXTokenAddressSet vaultId={},token={}",
            [event.params.vaultId.toString(),event.params.token.toHexString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }
  
  let xtoken = XToken.load(event.params.token.toHexString())
  if (xtoken == null) {
    xtoken = new XToken(event.params.token.toHexString())
    xtoken.symbol = fetchTokenSymbol(event.params.token)
    xtoken.name = fetchTokenName(event.params.token)
    xtoken.totalSupply = ZERO_BI
    xtoken.save()
  }
  
  vault.xToken = xtoken.id 
  vault.save()
}

export function handleNftAddressSet(event: NftAddressSet): void {
  log.info("\n\n============LOG=======================\n\n handleNftAddressSet vaultId={},asset={}",
            [event.params.vaultId.toString(),event.params.asset.toHexString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  let asset = Asset.load(event.params.asset.toHexString())
  if(asset == null) {
    asset = new Asset(event.params.asset.toHexString())
    asset.symbol = fetchTokenSymbol(event.params.asset)
    asset.name = fetchTokenName(event.params.asset)
    asset.save()
  }

  vault.asset = asset.id
  vault.save()
}

export function handleNegateEligibilitySet(event: NegateEligibilitySet): void {
  log.info("\n\n============LOG=======================\n\n handleNegateEligibilitySet vaultId={},_bool={}",
            [event.params.vaultId.toString(), event.params._bool ? 'true' : 'false'])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.negateEligibility = event.params._bool
  vault.save()
}

export function handleManagerSet(event: ManagerSet): void {
  log.info("\n\n============LOG=======================\n\n handleManagerSet vaultId={},manager={}",
            [event.params.vaultId.toString(), event.params.manager.toHexString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.manager = event.params.manager
  vault.save()
}

export function handleHoldingsAdded(event: HoldingsAdded): void {
  log.info('\n\n============LOG=======================\n\n handleHoldingsAdded vaultId={}, id={}',
            [event.params.vaultId.toString(),event.params.id.toString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  let holdings = vault.holdings
  holdings.push(event.params.id)
  vault.holdings = holdings
  vault.save()

  let xtoken = XToken.load(vault.xToken)
  xtoken.totalSupply = xtoken.totalSupply.plus(BigInt.fromI32(10000))
  xtoken.save()
}

export function handleHoldingsRemoved(event: HoldingsRemoved): void {
  log.info('\n\n============LOG=======================\n\n handleHoldingsRemoved vaultId={}, id={}',
            [event.params.vaultId.toString(),event.params.id.toString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  let holdings = vault.holdings
  let index = holdings.indexOf(event.params.id)
  // log.info('\n\n index=====>' + BigInt.fromI32(index).toString(),[])
  if(index > -1) {
    holdings.splice(index,1)
    vault.holdings = holdings
    vault.save()
  
    let xtoken = XToken.load(vault.xToken)
    xtoken.totalSupply = xtoken.totalSupply.minus(BigInt.fromI32(10000))
    xtoken.save()
  }
}

export function handleIsEligibleSet(event: IsEligibleSet): void {
  log.info("\n\n============LOG=======================\n\n handleIsEligibleSet vaultId={},id={},_bool={}",
            [event.params.vaultId.toString(), event.params.id.toString(), event.params._bool ? 'true' : 'false'])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  let eligibilities = vault.eligibilities
  let index = eligibilities.indexOf(event.params.id)
  // log.info('\n\n index=====>' + BigInt.fromI32(index).toString(),[])
  if(event.params._bool && index == -1) {
    // log.info('\n\n 添加 eligibilities',[])

    eligibilities.push(event.params.id)
    vault.eligibilities = eligibilities
    vault.save()
  } else if(!event.params._bool && index > -1) {
    // log.info('\n\n 移除 eligibilities',[])

    eligibilities.splice(index,1)
    vault.eligibilities = eligibilities
    vault.save()
  }
}

export function handleIsFinalizedSet(event: IsFinalizedSet): void {
  log.info("\n\n============LOG=======================\n\n handleIsFinalizedSet vaultId={},_isFinalized={}",
            [event.params.vaultId.toString(), event.params._isFinalized ? 'true' : 'false'])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.isFinalized = event.params._isFinalized
  vault.save()
}

export function handleIsClosedSet(event: IsClosedSet): void {
  log.info("\n\n============LOG=======================\n\n handleIsClosedSet vaultId={},_isClosed={}",
            [event.params.vaultId.toString(), event.params._isClosed ? 'true' : 'false'])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.isClosed = event.params._isClosed
  vault.save()
}

export function handleIs1155Set(event: Is1155Set): void {
  log.info("\n\n============LOG=======================\n\n handleIs1155Set vaultId={},_is1155={}",
            [event.params.vaultId.toString(), event.params._is1155 ? 'true' : 'false'])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.is1155 = event.params._is1155
  vault.save()
}

export function handleRangeSet(event: RangeSet): void {
  log.info("\n\n============LOG=======================\n\n handleRangeSet vaultId={},_rangeStart={},_rangeEnd={}",
            [event.params.vaultId.toString(), event.params._rangeStart.toString(), event.params._rangeEnd.toString()])

  let vault = Vault.load(event.params.vaultId.toString())
  if(vault == null) {
    return
  }

  vault.rangeStart = event.params._rangeStart
  vault.rangeEnd = event.params._rangeEnd
  vault.save()
}