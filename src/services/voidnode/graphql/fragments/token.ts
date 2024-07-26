import { gql } from '@apollo/client/core'

export const TokenFragment = gql`
	fragment Token on Token {
		_id
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

export const TokenPriceNodeFieldsFragment = gql`
	fragment TokenPriceNodeFields on TokenPriceNode {
		_id
		timestamp
		adapterType
		decimals
		sources
		prices
		liquidity
		tokens {
			_id
		}
		pairs {
			_id
		}

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
		_id
		symbol
		name
		decimals
		address
	}
`
