import { BigNumberish } from 'ethers'

import { Token } from './token'
import { Vault } from './vault'
import { VaultRegistry } from './vaultRegistry'

export enum VaultTransactionType {
	VAULT_DEPOSIT = 'VAULT_DEPOSIT',
	VAULT_WITHDRAW = 'VAULT_WITHDRAW',
	VAULT_TRADE = 'VAULT_TRADE',
	VAULT_SWAP = 'VAULT_SWAP',
	VAULT_PERFORMANCE_FEE = 'VAULT_PERFORMANCE_FEE',
	VAULT_MANAGEMENT_FEE = 'VAULT_MANAGEMENT_FEE',
	VAULT_LIQUIDITY_TRANSFER = 'VAULT_LIQUIDITY_TRANSFER',
	VAULT_LIQUIDITY_RECEIVE = 'VAULT_LIQUIDITY_RECEIVE',
}

export interface VaultTransaction {
	id: string
	registry: VaultRegistry
	vaultName: string
	vault: Vault
	tokenSymbol: string
	token: Token
	origin: string
	gasUsed: BigNumberish
	gasPrice: BigNumberish
	timestamp: BigNumberish
	block: BigNumberish
	logIndex: BigNumberish

	type: VaultTransactionType
	action: string
	description: string
	size: BigNumberish
	sizeETH: BigNumberish
	sizeUSD: BigNumberish
	user: string
}
