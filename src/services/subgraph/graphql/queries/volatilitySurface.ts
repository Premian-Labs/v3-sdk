import { DocumentNode, gql } from '@apollo/client/core'
import { PairInfo } from '@premia/pair-lists/src/types'
import { VolatilitySurfaceFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import { TokenPairQuery } from './tokenPair'
import PremiaSubgraph from '../../index'

export class VolatilitySurfaceQuery {
	static volatilitySurfaceId(pair: PairInfo, isCall: boolean): string {
		return (
			'surface:' +
			TokenPairQuery.pairIdFromPair(pair) +
			'/' +
			(isCall ? 'Call' : 'Put')
		)
	}

	@addFields
	static GetVolatilitySurface(
		subgraph: PremiaSubgraph,
		pair: PairInfo,
		isCall: boolean
	): DocumentNode {
		return gql`
        ${VolatilitySurfaceFragment}

        {
            volatilitySurface(id: "${this.volatilitySurfaceId(pair, isCall)}") {
                ...VolatilitySurface
            }
        }
    `
	}
}
