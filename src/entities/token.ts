import { BigNumberish } from 'ethers'
import { AdapterType } from '@premia/pair-lists'

import { TokenPair } from './tokenPair'

export { AdapterType } from '@premia/pair-lists'

/**
 * @interface TokenMinimal
 *
 * The TokenMinimal interface represents minimal data for a token in a blockchain.
 *
 * @property {string} address - The address of the token contract on the blockchain.
 * @property {string} symbol - The symbol used to represent the token.
 * @property {string} name - The name of the token.
 * @property {number} decimals - The number of decimal places the token can be divided into.
 */
export interface TokenMinimal {
	address: string
	symbol: string
	name: string
	decimals: number
}

export interface Token extends TokenMinimal {
	address: string
	symbol: string
	name: string
	decimals: number
	chainId: number
	isNative: boolean
	isWrappedNative: boolean
	priceETH?: BigNumberish
	priceUSD?: BigNumberish
}

export interface TokenExtended extends Token {
	priceETH: BigNumberish
	priceUSD: BigNumberish

	pricingPathChainlink: TokenPriceNode[]
	pricingPathUniswapV3: TokenPriceNode[]

	poolCount: BigNumberish
	vaultCount: BigNumberish
	openInterestETH: BigNumberish
	openInterestUSD: BigNumberish
	callOpenInterestETH: BigNumberish
	callOpenInterestUSD: BigNumberish
	putOpenInterestETH: BigNumberish
	putOpenInterestUSD: BigNumberish
	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish
	callTotalValueLockedETH: BigNumberish
	callTotalValueLockedUSD: BigNumberish
	putTotalValueLockedETH: BigNumberish
	putTotalValueLockedUSD: BigNumberish
	volumeETH: BigNumberish
	volumeUSD: BigNumberish
	callVolumeETH: BigNumberish
	callVolumeUSD: BigNumberish
	putVolumeETH: BigNumberish
	putVolumeUSD: BigNumberish
	premiumsETH: BigNumberish
	premiumsUSD: BigNumberish
	callPremiumsETH: BigNumberish
	callPremiumsUSD: BigNumberish
	putPremiumsETH: BigNumberish
	putPremiumsUSD: BigNumberish
	exercisePayoutsETH: BigNumberish
	exercisePayoutsUSD: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	protocolFeeRevenueETH: BigNumberish
	protocolFeeRevenueUSD: BigNumberish
}

export interface TokenPriceNode {
	timestamp: BigNumberish
	adapterType: AdapterType
	decimals: number
	sources: string[]
	prices: BigNumberish[]
	liquidity: BigNumberish[]
	tokens: Token[]
	pairs: TokenPair[]

	price: BigNumberish

	next: TokenPriceNode[]
	prev: TokenPriceNode[]
}
