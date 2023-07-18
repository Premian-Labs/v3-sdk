import { gql } from '@apollo/client/core'

export const VaultRegistryFragment = gql`
	fragment VaultRegistry on VaultRegistry {
		id
		chainId
		address
	}
`

export const VaultRegistryExtendedFragment = gql`
	${VaultRegistryFragment}

	fragment VaultRegistryExtended on VaultRegistry {
		...VaultRegistry

		txCount
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
		performanceFeeRevenueETH
		performanceFeeRevenueUSD
		managementFeeRevenueETH
		managementFeeRevenueUSD
	}
`
