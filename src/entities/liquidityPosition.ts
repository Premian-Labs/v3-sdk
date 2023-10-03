import { BigNumberish } from 'ethers'

import { Pool } from './pool'
import { Vault } from './vault'
import { User } from './user'

export enum OrderType {
	COLLATERAL_SHORT_USE_PREMIUMS,
	COLLATERAL_SHORT,
	LONG_COLLATERAL,
}

export interface PositionKey {
	owner: string
	operator: string
	lower: bigint
	upper: bigint
	orderType: OrderType
	isCall: boolean
	strike: bigint
}

export interface LiquidityPosition {
	pool: Pool
	owner: User
	operator: string
	orderType: OrderType
	lower: BigNumberish
	upper: BigNumberish
	tokenId: BigNumberish
	createdAt: BigNumberish
	createdAtBlock: BigNumberish
	closedAt?: BigNumberish
	closedAtBlock?: BigNumberish

	size: BigNumberish
	collateral: BigNumberish
	longs: BigNumberish
	shorts: BigNumberish

	lastFeeRate: BigNumberish
	feesClaimed: BigNumberish
	claimableFees: BigNumberish
}

export interface LiquidityPositionExtended extends LiquidityPosition {
	vault?: Vault

	collateral: BigNumberish
	collateralETH: BigNumberish
	collateralUSD: BigNumberish
	longs: BigNumberish
	longsETH: BigNumberish
	longsUSD: BigNumberish
	shorts: BigNumberish
	shortsETH: BigNumberish
	shortsUSD: BigNumberish
	initialLongs: BigNumberish
	initialShorts: BigNumberish

	lastFeeRate: BigNumberish
	claimableFees: BigNumberish
	claimableFeesETH: BigNumberish
	claimableFeesUSD: BigNumberish

	deposits: BigNumberish
	depositsETH: BigNumberish
	depositsUSD: BigNumberish
	withdrawals: BigNumberish
	withdrawalsETH: BigNumberish
	withdrawalsUSD: BigNumberish
	netDeposits: BigNumberish
	netDepositsETH: BigNumberish
	netDepositsUSD: BigNumberish
	feesClaimed: BigNumberish
	feesClaimedETH: BigNumberish
	feesClaimedUSD: BigNumberish
	premiumPaid: BigNumberish
	premiumPaidETH: BigNumberish
	premiumPaidUSD: BigNumberish
	premiumReceived: BigNumberish
	premiumReceivedETH: BigNumberish
	premiumReceivedUSD: BigNumberish
	exercisePayoutsPaid: BigNumberish
	exercisePayoutsPaidETH: BigNumberish
	exercisePayoutsPaidUSD: BigNumberish
	exercisePayoutsReceived: BigNumberish
	exercisePayoutsReceivedETH: BigNumberish
	exercisePayoutsReceivedUSD: BigNumberish

	totalValueLockedETH: BigNumberish
	totalValueLockedUSD: BigNumberish
	profitLossETH: BigNumberish
	profitLossUSD: BigNumberish
	profitLossETHPercent: BigNumberish
	profitLossUSDPercent: BigNumberish
}
