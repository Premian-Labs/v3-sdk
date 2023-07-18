import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'

export const LiquidityPositionFragment = gql`
	${PoolFragment}

	fragment LiquidityPosition on LiquidityPosition {
		id
		pool {
			...Pool
		}
		owner
		operator
		orderType
		lower
		upper
		tokenId
		createdAt
		createdAtBlock
		closedAt
		closedAtBlock

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

	fragment LiquidityPositionExtended on LiquidityPosition {
		...LiquidityPosition

		vault

		collateral
		collateralETH
		collateralUSD
		longs
		longsETH
		longsUSD
		shorts
		shortsETH
		shortsUSD
		initialSize
		initialLongs
		initialShorts
		initialMarketPrice

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
