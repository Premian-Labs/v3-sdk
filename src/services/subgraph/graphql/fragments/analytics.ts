import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { VaultFragment } from './vault'

export const PoolDayDataFragment = gql`
	${PoolFragment}

	fragment PoolDayData on PoolDayData {
		id
		periodStart
		pool {
			...Pool
		}

		txCount
		longs
		shorts
		openInterest
		openInterestETH
		openInterestUSD
		totalValueLocked
		totalValueLockedETH
		totalValueLockedUSD
		volume
		volumeETH
		volumeUSD
		premiums
		premiumsETH
		premiumsUSD
		premiumsPaid
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceived
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayouts
		exercisePayoutsETH
		exercisePayoutsUSD
		exercisePayoutsPaid
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceived
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenue
		feeRevenueETH
		feeRevenueUSD
		protocolFeeRevenue
		protocolFeeRevenueETH
		protocolFeeRevenueUSD

		marketPrice24h
		liquidityRate
		currentTick

		spotPrice
		impliedVolatility

		# pool price at end of period in collateralAsset
		marketPrice
		# opening pool price in collateralAsset
		open
		# high pool price in collateralAsset
		high
		# low pool price in collateralAsset
		low
		# close pool price in collateralAsset
		close
	}
`

export const PoolHourDataFragment = gql`
	${PoolFragment}

	fragment PoolHourData on PoolHourData {
		id
		periodStart
		pool {
			...Pool
		}

		txCount
		longs
		shorts
		openInterest
		openInterestETH
		openInterestUSD
		totalValueLocked
		totalValueLockedETH
		totalValueLockedUSD
		volume
		volumeETH
		volumeUSD
		premiums
		premiumsETH
		premiumsUSD
		premiumsPaid
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceived
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayouts
		exercisePayoutsETH
		exercisePayoutsUSD
		exercisePayoutsPaid
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceived
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenue
		feeRevenueETH
		feeRevenueUSD
		protocolFeeRevenue
		protocolFeeRevenueETH
		protocolFeeRevenueUSD

		marketPrice24h
		liquidityRate
		currentTick

		spotPrice
		impliedVolatility

		# pool price at end of period in collateralAsset
		marketPrice
		# opening pool price in collateralAsset
		open
		# high pool price in collateralAsset
		high
		# low pool price in collateralAsset
		low
		# close pool price in collateralAsset
		close
	}
`

export const PoolDayOrderbookDataFragment = gql`
	${PoolFragment}

	fragment PoolDayOrderbookData on PoolDayData {
		id
		periodStart
		pool {
			...Pool
		}

		openInterest
		totalValueLocked
		volume
		volumeETH
		volumeUSD

		marketPrice
		marketPrice24h
		liquidityRate
		currentTick

		spotPrice
		impliedVolatility

		open
		high
		low
		close
	}
`

export const VaultDayDataFragment = gql`
	${VaultFragment}

	fragment VaultDayData on VaultDayData {
		id
		periodStart
		vault {
			...Vault
		}

		totalDeposited
		totalDepositedUSD
		totalDepositedETH
		totalWithdrawn
		totalWithdrawnUSD
		totalWithdrawnETH
		netDeposited
		netDepositedUSD
		netDepositedETH
		totalAvailable
		totalAvailableUSD
		totalAvailableETH
		totalLocked
		totalLockedUSD
		totalLockedETH
		netSize
		netSizeUSD
		netSizeETH
		profitLoss
		profitLossETH
		profitLossUSD
		annualProfitLoss
		annualProfitLossETH
		annualProfitLossUSD
		utilizationPercent
		profitLossPercent
		annualPercentReturn
		totalPercentReturn

		txCount
		vxPremiaVotes
		openInterest
		openInterestETH
		openInterestUSD
		totalValueLocked
		totalValueLockedETH
		totalValueLockedUSD
		volume
		volumeETH
		volumeUSD
		premiums
		premiumsETH
		premiumsUSD
		premiumsPaid
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceived
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayouts
		exercisePayoutsETH
		exercisePayoutsUSD
		exercisePayoutsPaid
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceived
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenue
		feeRevenueETH
		feeRevenueUSD
		protocolFeeRevenue
		protocolFeeRevenueETH
		protocolFeeRevenueUSD
		performanceFeeRevenue
		performanceFeeRevenueETH
		performanceFeeRevenueUSD
		managementFeeRevenue
		managementFeeRevenueETH
		managementFeeRevenueUSD
	}
`
