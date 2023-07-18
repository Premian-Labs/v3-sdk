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
		tokenAddress: string
	): DocumentNode {
		return gql`
        ${PoolMinimalFragment}

        {
            pools(where: { base: "${tokenAddress.toLowerCase()}" }) {
                ...PoolMinimal
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
            pools(where: { base: "${tokenAddress.toLowerCase()}", strike: "${strike}", maturity: "${maturity}", optionType: "${optionType}" }) {
                ...PoolMinimal
            }
        }
    `
	}

	@addFields
	static GetPoolsExtended(
		subgraph: PremiaSubgraph,
		tokenAddress: string
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pools(where: { base: "${tokenAddress.toLowerCase()}" }) {
                ...PoolExtended
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
            pools(where: { ${isQuote ? 'quote' : 'base'}: "${TokenQuery.tokenId(
			token.address
		)}" }) {
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
		pair: TokenPairMinimal
	): DocumentNode {
		return gql`
        ${PoolMinimalFragment}

        {
            pools(where: { pair: "${TokenPairQuery.pairId(
							pair.base.address,
							pair.quote.address,
							pair.priceOracleAddress
						)}" }) {
                ...PoolMinimal

                impliedVolatility
                marketPrice
                spotPrice

                totalValueLocked
                totalValueLockedUSD
            }
        }
    `
	}

	@addFields
	static GetPoolsExtendedForPair(
		subgraph: PremiaSubgraph,
		pair: TokenPairMinimal
	): DocumentNode {
		return gql`
        ${PoolExtendedFragment}

        {
            pools(where: { pair: "${TokenPairQuery.pairId(
							pair.base.address,
							pair.quote.address,
							pair.priceOracleAddress
						)}" }) {
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
            pools(where: { pair: "${_pairId.toLowerCase()}" }) {
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
            pools(where: { pair: "${_pairId.toLowerCase()}" }) {
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
