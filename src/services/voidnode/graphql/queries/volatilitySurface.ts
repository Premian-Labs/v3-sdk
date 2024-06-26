import { DocumentNode, gql } from '@apollo/client/core'
import { PairInfo } from '@premia/pair-lists/src/types'

import { VolatilitySurfaceFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import { TokenPairQuery } from './tokenPair'
import PremiaVoidnode from '../../index'

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
		voidnode: PremiaVoidnode,
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
