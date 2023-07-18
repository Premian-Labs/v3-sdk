import { BigNumberish } from 'ethers'

import { IVault } from '../typechain/IVault'
import { OptionType } from './option'
import { Token, TokenMinimal } from './token'
import { VaultRegistry } from './vaultRegistry'

export enum VaultTradeSide {
	Buy = 'Buy',
	Sell = 'Sell',
	Both = 'Both',
}

export interface Vault {
	contract: IVault

	chainId: number
	address: string
	registry: VaultRegistry
	name: string
	asset: Token
	side: VaultTradeSide
	optionType: OptionType
	createdAt: BigNumberish
	createdAtBlock: BigNumberish
	removed: boolean
}

export interface VaultExtended extends Vault {
	totalDeposited: BigNumberish
	totalDepositedUSD: BigNumberish
	totalDepositedETH: BigNumberish
	totalWithdrawn: BigNumberish
	totalWithdrawnUSD: BigNumberish
	totalWithdrawnETH: BigNumberish
	netDeposited: BigNumberish
	netDepositedUSD: BigNumberish
	netDepositedETH: BigNumberish
	totalAvailable: BigNumberish
	totalAvailableUSD: BigNumberish
	totalAvailableETH: BigNumberish
	totalLocked: BigNumberish
	totalLockedUSD: BigNumberish
	totalLockedETH: BigNumberish
	netSize: BigNumberish
	netSizeUSD: BigNumberish
	netSizeETH: BigNumberish
	profitLoss: BigNumberish
	profitLossETH: BigNumberish
	profitLossUSD: BigNumberish
	annualProfitLoss: BigNumberish
	annualProfitLossETH: BigNumberish
	annualProfitLossUSD: BigNumberish
	utilizationPercent: BigNumberish
	profitLossPercent: BigNumberish
	annualPercentReturn: BigNumberish
	totalPercentReturn: BigNumberish

	txCount: BigNumberish
	vxPremiaVotes: BigNumberish
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
	performanceFeeRevenue: BigNumberish
	performanceFeeRevenueETH: BigNumberish
	performanceFeeRevenueUSD: BigNumberish
	managementFeeRevenue: BigNumberish
	managementFeeRevenueETH: BigNumberish
	managementFeeRevenueUSD: BigNumberish
}

export interface VaultMinimal {
	address: string
	name: string
	asset: TokenMinimal
	side: VaultTradeSide
	optionType: OptionType
	removed: boolean

	totalValueLockedUSD: BigNumberish
}
