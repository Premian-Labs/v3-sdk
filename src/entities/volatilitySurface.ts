import { BigNumberish } from 'ethers'

import { Token } from './token'
import { TokenPair } from './tokenPair'
import { Pool } from './pool'

export interface VolatilitySurface {
	quote: Token
	base: Token
	pair: TokenPair

	updatedAt: BigNumberish

	pools: Pool[]
}
