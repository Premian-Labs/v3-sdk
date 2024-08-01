import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish, getAddress } from 'ethers'

import { TickFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class TickQuery {
	static tickId(normalizedPrice: BigNumberish, poolAddress: string): string {
		return getAddress(poolAddress) + ':' + normalizedPrice.toString()
	}

	@addFields
	static GetTick(
		voidnode: PremiaVoidnode,
		normalizedPrice: BigNumberish,
		poolAddress: string
	): DocumentNode {
		return gql`
        ${TickFragment}

        {
            tick(id: "${this.tickId(normalizedPrice, poolAddress)}") {
                ...Tick
            }
        }
    `
	}
}
