import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { VaultFragment } from './vault'

export const LiquidityPositionFragment = gql`
	${PoolFragment}

	fragment LiquidityPosition on LiquidityPosition {
		id
		pool {
			...Pool
		}
		owner {
			address
		}
		operator
		orderType
		lower
		upper
		tokenId
		createdAt
		createdAtBlock
		closedAt
		closedAtBlock

		size
		collateral
		longs
		shorts

		lastFeeRate
		feesClaimed
		claimableFees
	}
`

export const LiquidityPositionExtendedFragment = gql`
	${LiquidityPositionFragment}
	${VaultFragment}

	fragment LiquidityPositionExtended on LiquidityPosition {
		...LiquidityPosition

		vault {
			...Vault
		}

		collateral
		collateralETH
		collateralUSD
		longs
		longsETH
		longsUSD
		shorts
		shortsETH
		shortsUSD
		initialLongs
		initialShorts

		lastFeeRate
		claimableFees
		claimableFeesETH
		claimableFeesUSD

		deposits
		depositsETH
		depositsUSD
		withdrawals
		withdrawalsETH
		withdrawalsUSD
		netDeposits
		netDepositsETH
		netDepositsUSD
		feesClaimed
		feesClaimedETH
		feesClaimedUSD
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
