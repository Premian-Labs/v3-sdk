import { gql } from '@apollo/client/core'

export const TokenFragment = gql`
	fragment Token on Token {
		id
		name
		symbol
		decimals
		address
		priceETH
		priceUSD
		chainId
		isNative
		isWrappedNative
	}
`

// export const TokenPriceNodeFragment = gql`
// 	fragment TokenPriceNode on TokenPriceNode {
// 		id
// 		timestamp
// 		adapterType
// 		decimals
// 		sources
// 		prices
// 		liquidity
// 		tokens
// 		pairs
//
// 		price
//
// 		next {
// 			...TokenPriceNode
// 		}
// 		prev {
// 			...TokenPriceNode
// 		}
// 	}
// `

export const TokenPriceNodeFieldsFragment = gql`
	fragment TokenPriceNodeFields on TokenPriceNode {
		id
		timestamp
		adapterType
		decimals
		sources
		prices
		liquidity
		tokens
		pairs

		price
	}
`
export const TokenPriceNodeFragment = gql`
	${TokenPriceNodeFieldsFragment}

	fragment TokenPriceNode on TokenPriceNode {
		...TokenPriceNodeFields

		next {
			...TokenPriceNodeFields
		}
		prev {
			...TokenPriceNodeFields
		}
	}
`

export const TokenExtendedFragment = gql`
	${TokenFragment}
	${TokenPriceNodeFragment}

	fragment TokenExtended on Token {
		...Token

		pricingPathChainlink {
			...TokenPriceNode
		}
		pricingPathUniswapV3 {
			...TokenPriceNode
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
	}
`

export const TokenMinimalFragment = gql`
	fragment TokenMinimal on Token {
		id
		symbol
		decimals
		address
	}
`
