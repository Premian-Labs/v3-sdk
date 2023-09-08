import { gql } from '@apollo/client/core'

import {
	TokenFragment,
	TokenMinimalFragment,
	TokenPriceNodeFragment,
} from './token'
import { VolatilitySurfaceFragment } from './volatilitySurface'
import { FactoryFragment } from './factory'

export const TokenPairMinimalFragment = gql`
	${TokenMinimalFragment}

	fragment TokenPairMinimal on TokenPair {
		id
		name
		quote {
			...TokenMinimal
		}
		base {
			...TokenMinimal
		}
		priceOracleAddress
	}
`

export const TokenPairFragment = gql`
	${TokenFragment}
	${FactoryFragment}

	fragment TokenPair on TokenPair {
		id
		factory {
			...Factory
		}
		name
		quote {
			...Token
		}
		quoteAdapterType
		base {
			...Token
		}
		baseAdapterType
		priceOracleAddress
		price

		totalValueLockedUSD
	}
`

export const TokenPairExtendedFragment = gql`
	${TokenPairFragment}
	${VolatilitySurfaceFragment}
	${TokenPriceNodeFragment}

	fragment TokenPairExtended on TokenPair {
		...TokenPair
		...VolatilitySurface

		quotePricingPath {
			...TokenPriceNode
		}
		basePricingPath {
			...TokenPriceNode
		}

		callSurface {
			...VolatilitySurface
		}
		putSurface {
			...VolatilitySurface
		}

		poolCount
		vaultCount
		openInterestETH
		openInterestUSD
		callOpenInterestETH
		callOpenInterestUSD
		putOpenInterestETH
		putOpenInterestUSD
		totalValueLockedETH
		totalValueLockedUSD
		callTotalValueLockedETH
		callTotalValueLockedUSD
		putTotalValueLockedETH
		putTotalValueLockedUSD
		volumeETH
		volumeUSD
		callVolumeETH
		callVolumeUSD
		putVolumeETH
		putVolumeUSD
		premiumsETH
		premiumsUSD
		callPremiumsETH
		callPremiumsUSD
		putPremiumsETH
		putPremiumsUSD
		exercisePayoutsETH
		exercisePayoutsUSD
		feeRevenueETH
		feeRevenueUSD
		protocolFeeRevenueETH
		protocolFeeRevenueUSD
		vxPremiaVotes
	}
`
