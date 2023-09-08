import { BigNumberish } from 'ethers'
import { Token } from "./token";
import { User } from "./user";

export interface Referral {
	user: User
  token: Token
  timestamp: BigNumberish
  tier: BigNumberish
  primaryRebate: BigNumberish
  primaryRebateETH: BigNumberish
  primaryRebateUSD: BigNumberish
  secondaryRebate: BigNumberish
  secondaryRebateETH: BigNumberish
  secondaryRebateUSD: BigNumberish
}