import { BigNumberish } from 'ethers'

export interface VaultRegistry {
	chainId: number
	address: string
}

export interface VaultRegistryExtended extends VaultRegistry {
	txCount: BigNumberish
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
	performanceFeeRevenueETH: BigNumberish
	performanceFeeRevenueUSD: BigNumberish
	managementFeeRevenueETH: BigNumberish
	managementFeeRevenueUSD: BigNumberish
}
