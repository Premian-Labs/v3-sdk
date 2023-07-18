import { BigNumberish } from 'ethers'

import { Pool } from './pool'
import { Vault } from './vault'

export interface PoolDayData {
	periodStart: BigNumberish
	pool: Pool

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

	marketPrice24h: BigNumberish
	liquidityRate: BigNumberish
	currentTick: BigNumberish

	spotPrice: BigNumberish
	impliedVolatility: BigNumberish

	marketPrice: BigNumberish
	open: BigNumberish
	high: BigNumberish
	low: BigNumberish
	close: BigNumberish
}

export interface PoolHourData {
	periodStart: BigNumberish
	pool: Pool

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

	marketPrice24h: BigNumberish
	liquidityRate: BigNumberish
	currentTick: BigNumberish

	spotPrice: BigNumberish
	impliedVolatility: BigNumberish

	marketPrice: BigNumberish
	open: BigNumberish
	high: BigNumberish
	low: BigNumberish
	close: BigNumberish
}

export interface VaultDayData {
	periodStart: BigNumberish
	vault: Vault

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
	longsUSD: BigNumberish
	longsETH: BigNumberish
	shortsUSD: BigNumberish
	shortsETH: BigNumberish
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
