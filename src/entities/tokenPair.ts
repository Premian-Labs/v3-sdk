import { BigNumberish } from 'ethers'

import { Factory } from './factory'
import { AdapterType, Token, TokenMinimal, TokenPriceNode } from './token'
import { VolatilitySurface } from './volatilitySurface'

export interface TokenPairMinimal {
	name: string
	base: TokenMinimal
	quote: TokenMinimal
	priceOracleAddress: string
}

export interface TokenPair extends TokenPairMinimal {
	factory: Factory
	name: string
	quote: Token
	quoteAdapterType: AdapterType
	base: Token
	baseAdapterType: AdapterType
	priceOracleAddress: string
	price: BigNumberish

	totalValueLockedUSD?: BigNumberish
}

export interface TokenPairExtended extends TokenPair {
	quotePricingPath: TokenPriceNode[]
	basePricingPath: TokenPriceNode[]

	callSurface: VolatilitySurface
	putSurface: VolatilitySurface

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
	vxPremiaVotes: BigNumberish
}
