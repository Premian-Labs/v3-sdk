import { DocumentNode, gql } from '@apollo/client/core'
import { PairInfo } from '@premia/pair-lists/src/types'

import { TokenPairExtendedFragment, TokenPairFragment } from '../fragments'
import { TokenQuery } from './token'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

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
	static GetPair(subgraph: PremiaSubgraph, pairId: string): DocumentNode {
		return gql`
        ${TokenPairFragment}

        {   
            tokenPair(id: "${pairId}",
			subgraphError: allow) {
                ...TokenPair
            }
        }
    `
	}

	@addFields
	static GetPairExtended(
		subgraph: PremiaSubgraph,
		pairId: string
	): DocumentNode {
		return gql`
        ${TokenPairExtendedFragment}

        {
            tokenPair(id: "${pairId}",
			subgraphError: allow) {
                ...TokenPairExtended
            }
        }
    `
	}

	@addFields
	static GetPairs(subgraph: PremiaSubgraph, pairIds: string[]): DocumentNode {
		return gql`
			${TokenPairFragment}

        {    
            tokenPairs(where: {
                id_in: [${pairIds.map((id) => `"${id}"`).join(', ')}]
            },
			subgraphError: allow) {
                ...TokenPair
            }
        }
		`
	}

	@addFields
	static GetPairsExtended(
		subgraph: PremiaSubgraph,
		pairIds: string[]
	): DocumentNode {
		return gql`
        ${TokenPairExtendedFragment}

        {    
            tokenPairs(where: {
                id_in: [${pairIds.map((id) => `"${id}"`).join(', ')}]
            },
			subgraphError: allow) {
                ...TokenPairExtended
            }
        }
    `
	}

	@addFields
	static GetAllPairs(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${TokenPairFragment}

			{
				tokenPairs(first: 250,
					subgraphError: allow) {
					...TokenPair
				}
			}
		`
	}

	@addFields
	static GetAllPairsExtended(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${TokenPairExtendedFragment}

			{
				tokenPairs(
					subgraphError: allow) {
					...TokenPairExtended
				}
			}
		`
	}
}
