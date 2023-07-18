import { DocumentNode, gql } from '@apollo/client/core'
import { TokenInfo } from '@premia/pair-lists/src/types'

import { TokenExtendedFragment, TokenFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class TokenQuery {
	static tokenId(address: string): string {
		return address.toLowerCase()
	}

	@addFields
	static GetToken(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${TokenFragment}
        
        {                
            token(id: "${this.tokenId(address)}") {
                ...Token
            }
        }
    `
	}

	@addFields
	static GetTokenExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${TokenExtendedFragment}

        {            
            token(id: "${this.tokenId(address)}") {
                ...TokenExtended
            }
        }
    `
	}

	@addFields
	static GetTokens(subgraph: PremiaSubgraph, tokens: string[]): DocumentNode {
		return gql`
        ${TokenFragment}
        
        {
            tokens(where: {
                id_in: [${tokens
									.map((token) => `"${this.tokenId(token)}"`)
									.join(', ')}]
            }) {
                ...Token
            }
        }
    `
	}

	@addFields
	static GetTokensExtended(
		subgraph: PremiaSubgraph,
		tokens: string[]
	): DocumentNode {
		return gql`
        ${TokenExtendedFragment}

        {
            tokens(where: {
                id_in: [${tokens
									.map((token) => `"${this.tokenId(token)}"`)
									.join(', ')}]
            }) {
                ...TokenExtended
            }
        }
    `
	}

	@addFields
	static GetTokenList(
		subgraph: PremiaSubgraph,
		tokens: TokenInfo[]
	): DocumentNode {
		return gql`
        ${TokenFragment}

        {
            tokens(where: {
                id_in: [${tokens
									.map((token) => `"${this.tokenId(token.address)}"`)
									.join(', ')}]
            }) {
                ...Token
            }
        }
    `
	}

	@addFields
	static GetTokenListExtended(
		subgraph: PremiaSubgraph,
		tokens: TokenInfo[]
	): DocumentNode {
		return gql`
        ${TokenExtendedFragment}

        {   
            tokens(where: {
                id_in: [${tokens
									.map((token) => `"${this.tokenId(token.address)}"`)
									.join(', ')}]
            }) {
                ...TokenExtended
            }
        }
    `
	}
}
