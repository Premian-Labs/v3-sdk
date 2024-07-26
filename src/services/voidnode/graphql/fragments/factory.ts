import { gql } from '@apollo/client/core'

export const FactoryMinimalFragment = gql`
	fragment FactoryMinimal on Factory {
		_id
		address
	}
`

export const FactoryFragment = gql`
	fragment Factory on Factory {
		_id
		chainId
		address
	}
`

export const FactoryExtendedFragment = gql`
	${FactoryFragment}

	fragment FactoryExtended on Factory {
		...Factory

		txCount
		poolCount
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
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayoutsETH
		exercisePayoutsUSD
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenueETH
		feeRevenueUSD
		protocolFeeRevenueETH
		protocolFeeRevenueUSD
	}
`
