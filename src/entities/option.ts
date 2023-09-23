import { BigNumberish } from 'ethers'

import { Token } from './token'

export enum OptionType {
	CALL = 'Call',
	PUT = 'Put',
}

export type OptionPhysicallySettled = {
	address: string
	name: string
	base: Token
	quote: Token
	isCall: boolean
	optionType: OptionType
	collateralAsset: Token
	strikeAsset: Token
}

export type OptionReward = {
	option: OptionPhysicallySettled
	oracleAdapter: string
	paymentSplitter: string
	discount: BigNumberish
	penalty: BigNumberish
	optionDuration: BigNumberish
	lockupDuration: BigNumberish
	claimDuration: BigNumberish
	fee: BigNumberish
	feeReceiver: string
}
