import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'

export const VaultPositionFragment = gql`
	${VaultFragment}

	fragment VaultPosition on VaultPosition {
		id
		vault {
			...Vault
		}
		owner

		createdAt
		createdAtBlock
		closedAt
		closedAtBlock

		size
		sizeETH
		sizeUSD
		shares
	}
`

export const VaultPositionExtendedFragment = gql`
	${VaultPositionFragment}

	fragment VaultPositionExtended on VaultPosition {
		...VaultPosition

		initialSize
		initialProfitLossPercent

		deposits
		depositsETH
		depositsUSD
		withdrawals
		withdrawalsETH
		withdrawalsUSD
		netDeposits
		netDepositsETH
		netDepositsUSD

		feesPaid
		feesPaidETH
		feesPaidUSD
		feeRevenue
		feeRevenueETH
		feeRevenueUSD

		premiumPaid
		premiumPaidETH
		premiumPaidUSD
		premiumReceived
		premiumReceivedETH
		premiumReceivedUSD

		exercisePayoutsPaid
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceived
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD

		totalValueLockedETH
		totalValueLockedUSD

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
	}
`
