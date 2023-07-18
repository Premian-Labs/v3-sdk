import { BigNumberish } from 'ethers'

import { Factory } from './factory'
import { Pool } from './pool'
import { Token } from './token'
import { TokenPair } from './tokenPair'
import { Vault } from './vault'

export enum TransactionType {
	POOL_DEPOSIT = 'POOL_DEPOSIT',
	POOL_WITHDRAW = 'POOL_WITHDRAW',
	POOL_CLAIM_FEES = 'POOL_CLAIM_FEES',
	POOL_TRADE = 'POOL_TRADE',
	POOL_FILL_QUOTE = 'POOL_FILL_QUOTE',
	POOL_SETTLE_POSITION = 'POOL_SETTLE_POSITION',
	POOL_LIQUIDITY_TRANSFER = 'POOL_LIQUIDITY_TRANSFER',
	POOL_LIQUIDITY_RECEIVE = 'POOL_LIQUIDITY_RECEIVE',
	SHORT_OPTION_SETTLE = 'SHORT_OPTION_SETTLE',
	SHORT_OPTION_TRANSFER = 'SHORT_OPTION_TRANSFER',
	SHORT_OPTION_RECEIVE = 'SHORT_OPTION_RECEIVE',
	LONG_OPTION_EXERCISE = 'LONG_OPTION_EXERCISE',
	LONG_OPTION_TRANSFER = 'LONG_OPTION_TRANSFER',
	LONG_OPTION_RECEIVE = 'LONG_OPTION_RECEIVE',
	DUAL_OPTION_ANNIHILATE = 'DUAL_OPTION_ANNIHILATE',
}

export interface Transaction {
	id: string
	factory: Factory
	poolName: string
	pool: Pool
	vaultName: string
	vault: Vault
	pairName: string
	pair: TokenPair
	tokenSymbol: string
	token: Token
	origin: string
	gasUsed: BigNumberish
	gasPrice: BigNumberish
	timestamp: BigNumberish
	block: BigNumberish
	logIndex: BigNumberish

	type: TransactionType
	action: string
	description: string
	size: BigNumberish
	sizeETH: BigNumberish
	sizeUSD: BigNumberish
	user: string
}
