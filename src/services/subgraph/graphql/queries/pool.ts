import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'
import {
	PoolExtendedFragment,
	PoolFragment,
	PoolMinimalFragment,
	TickFragment,
} from '../fragments'
import { OptionType, Token, TokenPairMinimal } from '../../../../entities'
import { addFields } from '../../../../utils/subgraph'
import { TokenQuery } from './token'
import { TokenPairQuery } from './tokenPair'
import PremiaSubgraph from '../../index'
import { TokenPairOrId } from '../../../..'

export class PoolQuery {
	static poolId(address: string): string {
		return address.toLowerCase()
	}

	@addFields
	static GetPoolMinimal(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${PoolMinimalFragment}

        {
            pool(id: "${this.poolId(address)}") {
                ...PoolMinimal
            }
        }
    `
	}

	@addFields
	static GetPool(subgraph: PremiaSubgraph, address: string): DocumentNode {
		return gql`
        ${PoolFragment}

        {
            pool(id: "${this.poolId(address)}") {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pool(id: "${this.poolId(address)}") {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetPools(
		subgraph: PremiaSubgraph,
		tokenAddress: string,
		isExpired?: boolean
	): DocumentNode {
		let filter = ''

		if (isExpired) {
			filter = `, maturity_lt: ${Math.floor(Date.now() / 1000)}`
		} else if (isExpired !== undefined && !isExpired) {
			filter = `, maturity_gt: ${Math.floor(Date.now() / 1000)}`
		}

		return gql`
        ${PoolFragment}

        {
            pools(
            	where: {
					base: "${tokenAddress.toLowerCase()}"
					${filter}
				}, 
            	first: 1000, 
            	orderBy: createdAt, 
            	orderDirection: desc
            ) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtended(
		subgraph: PremiaSubgraph,
		tokenAddress: string,
		isExpired?: boolean
	): DocumentNode {
		let filter = ''

		if (isExpired) {
			filter = `, maturity_lt: ${Math.floor(Date.now() / 1000)}`
		} else if (isExpired !== undefined && !isExpired) {
			filter = `, maturity_gt: ${Math.floor(Date.now() / 1000)}`
		}

		return gql`
        ${PoolExtendedFragment}

        {
            pools(
            	where: {
					base: "${tokenAddress.toLowerCase()}"
					${filter}
				},
            	first: 1000, 
				orderBy: createdAt, 
				orderDirection: desc
            ) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetAllPools(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${PoolFragment}

			{
				pools(first: 1000, orderBy: createdAt, orderDirection: desc) {
					...Pool
				}
			}
		`
	}

	@addFields
	static GetAllPoolsExtended(subgraph: PremiaSubgraph): DocumentNode {
		return gql`
			${PoolExtendedFragment}

			{
				pools(first: 1000, orderBy: createdAt, orderDirection: desc) {
					...PoolExtended
				}
			}
		`
	}

	@addFields
	static GetQuotePools(
		subgraph: PremiaSubgraph,
		tokenAddress: string,
		strike: BigNumberish,
		maturity: BigNumberish,
		optionType: OptionType
	): DocumentNode {
		return gql`
        ${PoolMinimalFragment}
        
        {
            pools(
            	where: { 
            		base: "${tokenAddress.toLowerCase()}", 
            		strike: "${strike}", 
            		maturity: "${maturity}", 
            		optionType: "${optionType}" 
            	},
            	first: 1000, 
				orderBy: createdAt, 
				orderDirection: desc
            ) {
                ...PoolMinimal
            }
        }
    `
	}

	@addFields
	static GetPoolsForToken(
		subgraph: PremiaSubgraph,
		token: Token,
		isQuote: boolean = false
	): DocumentNode {
		return gql`
        ${PoolFragment}

        {
            pools(
            	where: { ${isQuote ? 'quote' : 'base'}: "${TokenQuery.tokenId(
			token.address
		)}" },
            	first: 1000, 
				orderBy: createdAt, 
				orderDirection: desc
			) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForToken(
		subgraph: PremiaSubgraph,
		token: Token,
		isQuote: boolean = false
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pools(where: { ${isQuote ? 'quote' : 'base'}: "${TokenQuery.tokenId(
			token.address
		)}" }) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetPoolsForPair(
		subgraph: PremiaSubgraph,
		pair: TokenPairOrId,
		isExpired?: boolean
	): DocumentNode {
		const pairId = subgraph._parsePairId(pair)
		let filter = ''

		if (isExpired) {
			filter = `, maturity_lt: ${Math.floor(Date.now() / 1000)}`
		} else if (isExpired !== undefined && !isExpired) {
			filter = `, maturity_gt: ${Math.floor(Date.now() / 1000)}`
		}

		return gql`
        ${PoolFragment}

        {
            pools(where: {
				pair: "${pairId}",
				${filter}
			},
			first: 1000) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForPair(
		subgraph: PremiaSubgraph,
		pair: TokenPairOrId,
		options?: {
			strike?: BigNumberish
			maturity?: BigNumberish
			isExpired?: boolean
		}
	): DocumentNode {
		const pairId = subgraph._parsePairId(pair)
		let filter = ''

		if (options?.strike) {
			filter += `, strike: "${options.strike}"`
		}

		if (options?.maturity) {
			filter += `, maturity: "${options.maturity}"`
		}

		if (!options?.maturity && options?.isExpired) {
			filter += `, maturity_lt: ${Math.floor(Date.now() / 1000)}`
		} else if (
			!options?.maturity &&
			options?.isExpired !== undefined &&
			!options.isExpired
		) {
			filter += `, maturity_gt: ${Math.floor(Date.now() / 1000)}`
		}

		return gql`
        ${PoolExtendedFragment}

        {
            pools(where: {
				pair: "${pairId}",
				${filter}
			}) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetPoolsForPairId(
		subgraph: PremiaSubgraph,
		_pairId: string
	): DocumentNode {
		return gql`
        ${PoolFragment}

        {
            pools(
            	where: { pair: "${_pairId.toLowerCase()}" },
            	first: 1000, 
				orderBy: createdAt, 
				orderDirection: desc
            ) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForPairId(
		subgraph: PremiaSubgraph,
		_pairId: string
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pools(
            	where: { pair: "${_pairId.toLowerCase()}" }
            	first: 1000, 
				orderBy: createdAt, 
				orderDirection: desc
            ) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetTicks(
		subgraph: PremiaSubgraph,
		_poolAddress: string
	): DocumentNode {
		return gql`
        ${TickFragment}

        {
            ticks(where: { pool: "${_poolAddress.toLowerCase()}" }) {
                ...Tick
            }
        }
    `
	}
}
