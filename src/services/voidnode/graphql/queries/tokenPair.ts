import { DocumentNode, gql } from '@apollo/client/core'
import { PairInfo } from '@premia/pair-lists/src/types'

import { TokenPairExtendedFragment, TokenPairFragment } from '../fragments'
import { TokenQuery } from './token'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class TokenPairQuery {
	static pairId(
		baseAddress: string,
		quoteAddress: string,
		priceOracle: string
	): string {
		return `${TokenQuery.tokenId(baseAddress)}/${TokenQuery.tokenId(
			quoteAddress
		)}:${priceOracle.toLowerCase()}`
	}

	static pairIdFromPair(pair: PairInfo): string {
		return this.pairId(
			pair.base.address,
			pair.quote.address,
			pair.priceOracleAddress
		)
	}

	@addFields
	static GetPair(voidnode: PremiaVoidnode, pairId: string): DocumentNode {
		return gql`
        ${TokenPairFragment}

        {   
            tokenPair(id: "${pairId}") {
                ...TokenPair
            }
        }
    `
	}

	@addFields
	static GetPairExtended(
		voidnode: PremiaVoidnode,
		pairId: string
	): DocumentNode {
		return gql`
        ${TokenPairExtendedFragment}

        {
            tokenPair(id: "${pairId}") {
                ...TokenPairExtended
            }
        }
    `
	}

	@addFields
	static GetPairs(voidnode: PremiaVoidnode, pairIds: string[]): DocumentNode {
		return gql`
			${TokenPairFragment}

        {    
            tokenPairs(where: {
                id_in: [${pairIds.map((id) => `"${id}"`).join(', ')}]
            }) {
                ...TokenPair
            }
        }
		`
	}

	@addFields
	static GetPairsExtended(
		voidnode: PremiaVoidnode,
		pairIds: string[]
	): DocumentNode {
		return gql`
        ${TokenPairExtendedFragment}

        {    
            tokenPairs(where: {
                id_in: [${pairIds.map((id) => `"${id}"`).join(', ')}]
            }) {
                ...TokenPairExtended
            }
        }
    `
	}

	@addFields
	static GetAllPairs(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${TokenPairFragment}

			{
				tokenPairs(limit: 250) {
					...TokenPair
				}
			}
		`
	}

	@addFields
	static GetAllPairsExtended(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${TokenPairExtendedFragment}

			{
				tokenPairs(limit: 250) {
					...TokenPairExtended
				}
			}
		`
	}
}
