import { gql } from '@apollo/client/core'

import { TokenFragment, TokenMinimalFragment } from './token'
import { VaultRegistryFragment } from './vaultRegistry'
import { TokenPairFragment } from './tokenPair'

export const VaultFragment = gql`
	${TokenFragment}
	${VaultRegistryFragment}

	fragment Vault on Vault {
		id
		chainId
		address
		registry {
			...VaultRegistry
		}
		name
		asset {
			...Token
		}
		side
		optionType
		createdAt
		createdAtBlock
		removed
	}
`

export const VaultExtendedFragment = gql`
	${VaultFragment}
	${TokenPairFragment}

	fragment VaultExtended on Vault {
		...Vault

		supportedPairs {
			...TokenPair
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
		vxPremiaVotes
	}
`

export const VaultMinimalFragment = gql`
	${TokenMinimalFragment}

	fragment VaultMinimal on Vault {
		id
		address
		name
		asset {
			...TokenMinimal
		}
		side
		optionType
		removed

		totalValueLockedUSD
	}
`
