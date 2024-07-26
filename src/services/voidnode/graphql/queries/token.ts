import { DocumentNode, gql } from '@apollo/client/core'
import { TokenInfo } from '@premia/pair-lists/src/types'
import { getAddress } from 'ethers'

import { TokenExtendedFragment, TokenFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class TokenQuery {
	static tokenId(address: string): string {
		return getAddress(address)
	}

	@addFields
	static GetToken(voidnode: PremiaVoidnode, address: string): DocumentNode {
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
		voidnode: PremiaVoidnode,
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
	static GetTokens(voidnode: PremiaVoidnode, tokens: string[]): DocumentNode {
		return gql`
        ${TokenFragment}
        
        {
            tokens(where: {
                _id_in: [${tokens
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
		voidnode: PremiaVoidnode,
		tokens: string[]
	): DocumentNode {
		return gql`
        ${TokenExtendedFragment}

        {
            tokens(where: {
                _id_in: [${tokens
									.map((token) => `"${this.tokenId(token)}"`)
									.join(', ')}]
            }) {
                ...TokenExtended
            }
        }
    `
	}

	@addFields
	static GetAllTokens(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${TokenFragment}

			{
				tokens(limit: 250) {
					...Token
				}
			}
		`
	}

	@addFields
	static GetAllTokensExtended(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${TokenExtendedFragment}

			{
				tokens {
					...TokenExtended
				}
			}
		`
	}

	@addFields
	static GetTokenList(
		voidnode: PremiaVoidnode,
		tokens: TokenInfo[]
	): DocumentNode {
		return gql`
        ${TokenFragment}

        {
            tokens(where: {
                _id_in: [${tokens
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
		voidnode: PremiaVoidnode,
		tokens: TokenInfo[]
	): DocumentNode {
		return gql`
        ${TokenExtendedFragment}

        {   
            tokens(where: {
                _id_in: [${tokens
									.map((token) => `"${this.tokenId(token.address)}"`)
									.join(', ')}]
            }) {
                ...TokenExtended
            }
        }
    `
	}
}
