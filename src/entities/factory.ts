import { BigNumberish } from 'ethers'

export interface FactoryMinimal {
	address: string
}

export interface Factory extends FactoryMinimal {
	chainId: number
	address: string
}

export interface FactoryExtended extends Factory {
	txCount: BigNumberish
	poolCount: BigNumberish
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
	premiumsPaidETH: BigNumberish
	premiumsPaidUSD: BigNumberish
	premiumsReceivedETH: BigNumberish
	premiumsReceivedUSD: BigNumberish
	exercisePayoutsETH: BigNumberish
	exercisePayoutsUSD: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	protocolFeeRevenueETH: BigNumberish
	protocolFeeRevenueUSD: BigNumberish
}
