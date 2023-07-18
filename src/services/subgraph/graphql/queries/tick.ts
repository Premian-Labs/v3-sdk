import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'

import { TickFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class TickQuery {
	static tickId(normalizedPrice: BigNumberish, poolAddress: string): string {
		return poolAddress.toLowerCase() + ':' + normalizedPrice.toString()
	}

	@addFields
	static GetTick(
		subgraph: PremiaSubgraph,
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
