import { BigNumberish } from 'ethers'

import { Vault } from './vault'

export interface VaultPosition {
	vault: Vault
	owner: string
	createdAt: BigNumberish
	createdAtBlock: BigNumberish
	closedAt: BigInt
	closedAtBlock: BigInt

	size: BigNumberish
	sizeETH: BigNumberish
	sizeUSD: BigNumberish
	shares: BigNumberish
}

export interface VaultPositionExtended extends VaultPosition {
	initialSize: BigNumberish
	initialProfitLossPercent: BigNumberish

	deposits: BigNumberish
	depositsETH: BigNumberish
	depositsUSD: BigNumberish
	withdrawals: BigNumberish
	withdrawalsETH: BigNumberish
	withdrawalsUSD: BigNumberish
	netDeposits: BigNumberish
	netDepositsETH: BigNumberish
	netDepositsUSD: BigNumberish
	feesPaid: BigNumberish
	feesPaidETH: BigNumberish
	feesPaidUSD: BigNumberish
	feeRevenue: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
	premiumPaid: BigNumberish
	premiumPaidETH: BigNumberish
	premiumPaidUSD: BigNumberish
	premiumReceived: BigNumberish
	premiumReceivedETH: BigNumberish
	premiumReceivedUSD: BigNumberish
	exercisePayoutsPaid: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceived: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish

	totalValueLocked: BigNumberish
	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish
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
}
