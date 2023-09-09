import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { VaultFragment } from './vault'

export const OptionPositionFragment = gql`
	${PoolFragment}

	fragment OptionPosition on OptionPosition {
		id
		pool {
			...Pool
		}
		owner {
			address
		}
		isBuy
		tokenType
		createdAt
		createdAtBlock
		closedAt
		closedAtBlock

		size
	}
`

export const OptionPositionExtendedFragment = gql`
	${OptionPositionFragment}
	${VaultFragment}

	fragment OptionPositionExtended on OptionPosition {
		...OptionPosition

		vault {
			...Vault
		}

		size
		sizeETH
		sizeUSD

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
		profitLossETH
		profitLossUSD
		profitLossETHPercent
		profitLossUSDPercent
	}
`
