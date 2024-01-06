import { BigNumberish } from 'ethers'

import { Token } from './token'
import { OptionPhysicallySettled } from './option'

export enum OptionPSTransactionType {
	OPTION_PS_EXERCISE = 'OPTION_PS_EXERCISE',
	OPTION_PS_CANCEL_EXERCISE = 'OPTION_PS_CANCEL_EXERCISE',
	OPTION_PS_SETTLE_LONG = 'OPTION_PS_SETTLE_LONG',
	OPTION_PS_SETTLE_SHORT = 'OPTION_PS_SETTLE_SHORT',
	OPTION_PS_ANNIHILATE = 'OPTION_PS_ANNIHILATE',
	OPTION_REWARD_UNDERWRITE = 'OPTION_REWARD_UNDERWRITE',
	SHORT_OPTION_TRANSFER = 'SHORT_OPTION_TRANSFER',
	SHORT_OPTION_RECEIVE = 'SHORT_OPTION_RECEIVE',
	LONG_OPTION_PS_TRANSFER = 'LONG_OPTION_PS_TRANSFER',
	LONG_OPTION_PS_RECEIVE = 'LONG_OPTION_PS_RECEIVE',
}

export interface OptionPSTransaction {
	id: string
	option: OptionPhysicallySettled
	tokenSymbol: string
	token: Token
	origin: string
	gasUsed: BigNumberish
	gasPrice: BigNumberish
	timestamp: BigNumberish
	block: BigNumberish
	logIndex: BigNumberish

	type: OptionPSTransactionType
	action: string
	description: string
	size: BigNumberish
	sizeETH: BigNumberish
	sizeUSD: BigNumberish
	user: string
}
