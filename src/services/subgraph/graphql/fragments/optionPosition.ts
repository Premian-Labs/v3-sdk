import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { OptionPhysicallySettledFragment } from './option'
import { VaultFragment } from './vault'
import { TokenFragment } from './token'

export const OptionPositionFragment = gql`
	${TokenFragment}

	fragment OptionPosition on OptionPosition {
		id
		address
		base {
			...Token
		}
		quote {
			...Token
		}
		strike
		maturity
		optionType
		isCall
		spotPrice
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
		closedSize
		entryPrice
		closePrice
	}
`

export const OptionPositionExtendedFragment = gql`
	${OptionPositionFragment}
	${PoolFragment}
	${OptionPhysicallySettledFragment}
	${VaultFragment}

	fragment OptionPositionExtended on OptionPosition {
		...OptionPosition

		pool {
			...Pool
		}

		option {
			...OptionPhysicallySettled
		}

		vault {
			...Vault
		}

		sizeETH
		sizeUSD
		closedSizeETH
		closedSizeUSD
		entryPriceETH
		entryPriceUSD
		closePriceETH
		closePriceUSD

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
