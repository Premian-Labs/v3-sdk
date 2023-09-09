import { BigNumberish } from 'ethers'

import {
	LiquidityPosition,
	LiquidityPositionExtended,
} from './liquidityPosition'
import { OptionPosition, OptionPositionExtended } from './optionPosition'
import { VaultPosition, VaultPositionExtended } from './vaultPosition'
import { Transaction } from './transaction'
import { VaultTransaction } from './vaultTransaction'
import { Referral } from './referral'

export interface ActionAuthorization {
	actions: bigint[]
	authorization: boolean[]
}

export interface User {
	address: string

	claimableFeesETH: BigNumberish
	claimableFeesUSD: BigNumberish
	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish

	profitLossETH: BigNumberish
	profitLossUSD: BigNumberish
	profitLossETHPercent: BigNumberish
	profitLossUSDPercent: BigNumberish
	poolDepositsETH: BigNumberish
	poolDepositsUSD: BigNumberish
	poolProfitLossETH: BigNumberish
	poolProfitLossUSD: BigNumberish
	poolProfitLossETHPercent: BigNumberish
	poolProfitLossUSDPercent: BigNumberish
	optionDepositsETH: BigNumberish
	optionDepositsUSD: BigNumberish
	optionProfitLossETH: BigNumberish
	optionProfitLossUSD: BigNumberish
	optionProfitLossETHPercent: BigNumberish
	optionProfitLossUSDPercent: BigNumberish
	vaultDepositsETH: BigNumberish
	vaultDepositsUSD: BigNumberish
	vaultProfitLossETH: BigNumberish
	vaultProfitLossUSD: BigNumberish
	vaultProfitLossETHPercent: BigNumberish
	vaultProfitLossUSDPercent: BigNumberish
}

export interface UserExtended extends User {
	depositsETH: BigNumberish
	depositsUSD: BigNumberish
	withdrawalsETH: BigNumberish
	withdrawalsUSD: BigNumberish
	netDepositsETH: BigNumberish
	netDepositsUSD: BigNumberish
	collateralETH: BigNumberish
	collateralUSD: BigNumberish
	longsETH: BigNumberish
	longsUSD: BigNumberish
	shortsETH: BigNumberish
	shortsUSD: BigNumberish
	volumeETH: BigNumberish
	volumeUSD: BigNumberish
	premiumsPaidETH: BigNumberish
	premiumsPaidUSD: BigNumberish
	premiumsReceivedETH: BigNumberish
	premiumsReceivedUSD: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	feesPaidETH: BigNumberish
	feesPaidUSD: BigNumberish

	primaryReferrer?: User
	secondaryReferrer?: User
	totalReferrals: number
	totalSecondaryReferrals: number
	referralRebatesEarnedETH: BigNumberish
	referralRebatesEarnedUSD: BigNumberish
	referrals: Referral[]
	secondaryReferrals: Referral[]
}

export interface UserPortfolio extends UserExtended {
	liquidityPositions: LiquidityPosition[]
	optionPositions: OptionPosition[]
	vaultPositions: VaultPosition[]
}

export interface UserPortfolioHistory extends UserPortfolio {
	snapshots: UserSnapshot[]
	poolTransactions: Transaction[]
	vaultTransactions: VaultTransaction[]
}

export interface UserPortfolioExtended extends UserPortfolio {
	liquidityPositions: LiquidityPositionExtended[]
	optionPositions: OptionPositionExtended[]
	vaultPositions: VaultPositionExtended[]

	snapshots: UserSnapshotExtended[]
	poolTransactions: Transaction[]
	vaultTransactions: VaultTransaction[]
}

export interface UserSnapshot {
	timestamp: BigNumberish
	block: BigNumberish
	transaction: Transaction

	claimableFeesETH: BigNumberish
	claimableFeesUSD: BigNumberish
	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish
	netDepositsETH: BigNumberish
	netDepositsUSD: BigNumberish

	profitLossETH: BigNumberish
	profitLossUSD: BigNumberish
	profitLossETHPercent: BigNumberish
	profitLossUSDPercent: BigNumberish
	poolDepositsETH: BigNumberish
	poolDepositsUSD: BigNumberish
	poolProfitLossETH: BigNumberish
	poolProfitLossUSD: BigNumberish
	poolProfitLossETHPercent: BigNumberish
	poolProfitLossUSDPercent: BigNumberish
	optionDepositsETH: BigNumberish
	optionDepositsUSD: BigNumberish
	optionProfitLossETH: BigNumberish
	optionProfitLossUSD: BigNumberish
	optionProfitLossETHPercent: BigNumberish
	optionProfitLossUSDPercent: BigNumberish
	vaultDepositsETH: BigNumberish
	vaultDepositsUSD: BigNumberish
	vaultProfitLossETH: BigNumberish
	vaultProfitLossUSD: BigNumberish
	vaultProfitLossETHPercent: BigNumberish
	vaultProfitLossUSDPercent: BigNumberish
}

export interface UserSnapshotExtended extends UserSnapshot {
	collateralETH: BigNumberish
	collateralUSD: BigNumberish
	longsETH: BigNumberish
	longsUSD: BigNumberish
	shortsETH: BigNumberish
	shortsUSD: BigNumberish
	depositsETH: BigNumberish
	depositsUSD: BigNumberish
	withdrawalsETH: BigNumberish
	withdrawalsUSD: BigNumberish
	volumeETH: BigNumberish
	volumeUSD: BigNumberish
	premiumsPaidETH: BigNumberish
	premiumsPaidUSD: BigNumberish
	premiumsReceivedETH: BigNumberish
	premiumsReceivedUSD: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	feesPaidETH: BigNumberish
	feesPaidUSD: BigNumberish
}
