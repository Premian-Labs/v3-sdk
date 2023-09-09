import { BigNumberish } from 'ethers'
import { Token } from './token'
import { User } from './user'

export interface Referral {
	user: User
	primaryReferrer: User
	secondaryReferrer?: User
	volumeETH: BigNumberish
	volumeUSD: BigNumberish
	premiumsETH: BigNumberish
	premiumsUSD: BigNumberish
	primaryRebatesEarnedETH: BigNumberish
	primaryRebatesEarnedUSD: BigNumberish
	secondaryRebatesEarnedETH: BigNumberish
	secondaryRebatesEarnedUSD: BigNumberish
}
