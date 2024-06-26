import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'

import PremiaVoidnode from '../../index'
import {
	PoolExtendedFragment,
	PoolFragment,
	PoolMinimalFragment,
	TickFragment,
} from '../fragments'
import { OptionType, Token } from '../../../../entities'
import { addFields } from '../../../../utils/voidnode'
import { TokenQuery } from './token'
import { TokenPairOrId } from '../../../..'

export class PoolQuery {
	static poolId(address: string): string {
		return address.toLowerCase()
	}

	@addFields
	static GetPoolMinimal(
		voidnode: PremiaVoidnode,
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
	static GetPool(voidnode: PremiaVoidnode, address: string): DocumentNode {
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
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
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
            	limit: 1000, 
            	orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
            ) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtended(
		voidnode: PremiaVoidnode,
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
            	limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
            ) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetAllPools(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${PoolFragment}

			{
				pools(limit: 1000, orderBy: [{ field: createdAt, direction: DESC }]) {
					...Pool
				}
			}
		`
	}

	@addFields
	static GetAllPoolsExtended(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${PoolExtendedFragment}

			{
				pools(limit: 1000, orderBy: [{ field: createdAt, direction: DESC }]) {
					...PoolExtended
				}
			}
		`
	}

	@addFields
	static GetQuotePools(
		voidnode: PremiaVoidnode,
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
            	limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
            ) {
                ...PoolMinimal
            }
        }
    `
	}

	@addFields
	static GetPoolsForToken(
		voidnode: PremiaVoidnode,
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
            	limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
			) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForToken(
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
		pair: TokenPairOrId,
		isExpired?: boolean
	): DocumentNode {
		const pairId = voidnode._parsePairId(pair)
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
					pair: "${pairId}",
					${filter}
				},
				limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
			) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForPair(
		voidnode: PremiaVoidnode,
		pair: TokenPairOrId,
		options?: {
			strike?: BigNumberish
			maturity?: BigNumberish
			isExpired?: boolean
		}
	): DocumentNode {
		const pairId = voidnode._parsePairId(pair)
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
            pools(
				where: {
					pair: "${pairId}",
					${filter}
				},
				limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
			) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetPoolsForPairId(
		voidnode: PremiaVoidnode,
		_pairId: string
	): DocumentNode {
		return gql`
        ${PoolFragment}

        {
            pools(
            	where: { pair: "${_pairId.toLowerCase()}" },
            	limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
            ) {
                ...Pool
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForPairId(
		voidnode: PremiaVoidnode,
		_pairId: string
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pools(
            	where: { pair: "${_pairId.toLowerCase()}" }
            	limit: 1000, 
				orderBy: [{
					field: createdAt, 
					direction: DESC
				}]
            ) {
                ...PoolExtended
            }
        }
    `
	}

	@addFields
	static GetTicks(
		voidnode: PremiaVoidnode,
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
