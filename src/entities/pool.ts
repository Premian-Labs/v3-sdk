import { BigNumberish } from 'ethers'

import { Factory, FactoryMinimal } from './factory'
import { TokenPair, TokenPairMinimal } from './tokenPair'
import { AdapterType, Token, TokenMinimal } from './token'
import { VolatilitySurface } from './volatilitySurface'
import { OptionType } from './option'

export interface PoolKey {
	base: string
	quote: string
	oracleAdapter: string
	strike: BigNumberish
	maturity: BigNumberish
	isCallPool: boolean
}

export interface PoolMinimal {
	initialized: boolean
	address: string
	factory: FactoryMinimal
	pair: TokenPairMinimal
	quoteAdapterType: AdapterType
	baseAdapterType: AdapterType
	collateralAsset: TokenMinimal
	optionType: OptionType
	isCall: boolean
	strike: BigNumberish
	maturity: BigNumberish
}

export interface Pool extends PoolMinimal {
	name: string
	pairName: string
	factory: Factory
	pair: TokenPair
	quote: Token
	base: Token
	collateralAsset: Token
	priceOracle: string
	createdAt: BigNumberish
	createdAtBlock: BigNumberish

	marketPrice: BigNumberish
	marketPrice24h: BigNumberish
	liquidityRate: BigNumberish
	currentTick: BigNumberish

	spotPrice: BigNumberish

	longLiquidity: BigNumberish
	shortLiquidity: BigNumberish
	openInterest: BigNumberish
	openInterestUSD: BigNumberish
	volume: BigNumberish
	volumeUSD: BigNumberish
}

export interface PoolExtended extends Pool {
	volatilitySurface: VolatilitySurface

	txCount: BigNumberish
	longs: BigNumberish
	shorts: BigNumberish
	openInterest: BigNumberish
	openInterestETH: BigNumberish
	openInterestUSD: BigNumberish
	totalValueLocked: BigNumberish
	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish
	volume: BigNumberish
	volumeETH: BigNumberish
	volumeUSD: BigNumberish
	premiums: BigNumberish
	premiumsETH: BigNumberish
	premiumsUSD: BigNumberish
	premiumsPaid: BigNumberish
	premiumsPaidETH: BigNumberish
	premiumsPaidUSD: BigNumberish
	premiumsReceived: BigNumberish
	premiumsReceivedETH: BigNumberish
	premiumsReceivedUSD: BigNumberish
	exercisePayouts: BigNumberish
	exercisePayoutsETH: BigNumberish
	exercisePayoutsUSD: BigNumberish
	exercisePayoutsPaid: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceived: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish
	feeRevenue: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	protocolFeeRevenue: BigNumberish
	protocolFeeRevenueETH: BigNumberish
	protocolFeeRevenueUSD: BigNumberish
}
