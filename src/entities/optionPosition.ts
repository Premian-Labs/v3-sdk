import { BigNumberish } from 'ethers'

import { Pool } from './pool'
import { Vault } from './vault'
import { User } from './user'
import { OptionPhysicallySettled, OptionType } from './option'
import { Token } from './token'

export enum TokenType {
	SHORT = 0,
	LONG = 1,
	LONG_EXERCISED = 2,
}

export enum TokenTypeString {
	SHORT = 'SHORT',
	LONG = 'LONG',
	LONG_EXERCISED = 'LONG_EXERCISED',
}

export interface OptionPosition {
	id: string
	address: string
	base: Token
	quote: Token
	strike: BigNumberish
	maturity: BigNumberish
	optionType: OptionType
	isCall: boolean
	spotPrice: BigNumberish
	owner: User
	isBuy: boolean
	tokenType: TokenTypeString
	createdAt: BigNumberish
	createdAtBlock: BigNumberish
	closedAt?: BigNumberish
	closedAtBlock?: BigNumberish

	size: BigNumberish
	closedSize: BigNumberish
	entryPrice: BigNumberish
	closePrice: BigNumberish
}

export interface OptionPositionExtended extends OptionPosition {
	pool?: Pool
	option?: OptionPhysicallySettled
	vault?: Vault

	sizeETH: BigNumberish
	sizeUSD: BigNumberish

	closedSizeETH: BigNumberish
	closedSizeUSD: BigNumberish
	entryPriceETH: BigNumberish
	entryPriceUSD: BigNumberish
	closePriceETH: BigNumberish
	closePriceUSD: BigNumberish

	deposits: BigNumberish
	depositsETH: BigNumberish
	depositsUSD: BigNumberish
	withdrawals: BigNumberish
	withdrawalsETH: BigNumberish
	withdrawalsUSD: BigNumberish
	netDeposits: BigNumberish
	netDepositsETH: BigNumberish
	netDepositsUSD: BigNumberish
	feesPaid: BigNumberish
	feesPaidETH: BigNumberish
	feesPaidUSD: BigNumberish
	feeRevenue: BigNumberish
	feeRevenueETH: BigNumberish
	feeRevenueUSD: BigNumberish
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
