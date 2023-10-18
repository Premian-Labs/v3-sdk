import { gql } from '@apollo/client/core'

import { TokenFragment, TokenMinimalFragment } from './token'
import { TokenPairFragment, TokenPairMinimalFragment } from './tokenPair'
import { VolatilitySurfaceFragment } from './volatilitySurface'
import { FactoryFragment, FactoryMinimalFragment } from './factory'

export const PoolMinimalFragment = gql`
	${TokenMinimalFragment}
	${TokenPairMinimalFragment}
	${FactoryMinimalFragment}

	fragment PoolMinimal on Pool {
		id
		address
		factory {
			...FactoryMinimal
		}
		pair {
			...TokenPairMinimal
		}
		quoteAdapterType
		baseAdapterType
		collateralAsset {
			...TokenMinimal
		}
		optionType
		isCall
		strike
		maturity
	}
`

export const PoolFragment = gql`
	${FactoryFragment}
	${TokenFragment}
	${TokenPairFragment}

	fragment Pool on Pool {
		id
		address
		name
		pairName
		factory {
			...Factory
		}
		pair {
			...TokenPair
		}
		quote {
			...Token
		}
		quoteAdapterType
		base {
			...Token
		}
		baseAdapterType
		collateralAsset {
			...Token
		}
		optionType
		isCall
		strike
		maturity
		isExpired
		isExpiredITM
		isExpiredOTM
		createdAt
		createdAtBlock

		marketPrice
		marketPrice24h
		liquidityRate
		currentTick

		spotPrice

		longLiquidity
		shortLiquidity
		openInterest
		openInterestUSD
		volume
		volumeUSD
	}
`

export const PoolExtendedFragment = gql`
	${PoolFragment}
	${VolatilitySurfaceFragment}

	fragment PoolExtended on Pool {
		...Pool

		volatilitySurface {
			...VolatilitySurface
		}

		totalValueLocked
		totalValueLockedUSD
		totalValueLockedETH

		txCount
		longs
		shorts
		openInterestETH
		volumeETH
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
	}
`
