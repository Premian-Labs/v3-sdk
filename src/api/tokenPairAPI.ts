import { PairInfo } from '@premia/pair-lists/src/types'
import { toBigInt } from 'ethers'
import { BlackScholes } from '@uqee/black-scholes'

import { TokenPair, TokenPairExtended, TokenPairMinimal } from '../entities'
import { BaseAPI } from './baseAPI'

// Newton-Raphoson method fails for low vega options (near dated or deep OTM-ITM)
// So we use a slower, but more universal bisection
export const blackScholes = new BlackScholes({
	priceToSigmaMethod: 'bisection',
	priceToSigmaAccuracy: 1e-2,
	priceToSigmaBRight: 4,
})
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365

export type TokenPairOrInfo = PairInfo | TokenPair | TokenPairMinimal
export type TokenPairOrId = TokenPairOrInfo | string

/**
 * Represents a class for handling `TokenPair` operations related to the subgraph.
 *
 * @class TokenPairAPI
 * @extends {BaseAPI}
 */
export class TokenPairAPI extends BaseAPI {
	/**
	 * Fetches the current spot price of a token pair from the price oracle.
	 * Uses caching with a one-minute time-to-live.
	 *
	 * @param {TokenPairOrId} pair - The token pair to fetch the spot price for.
	 *
	 * @returns {Promise<bigint>} The current spot price of the token pair.
	 */
	async getSpotPrice(pair: TokenPairOrId): Promise<bigint> {
		const _pair = this.premia.subgraph._parsePair(pair)
		const oracleAdapter = await this.premia.contracts.getOracleAdapterContract(
			_pair.priceOracleAddress
		)
		return toBigInt(await oracleAdapter.getPrice(_pair.base, _pair.quote))
	}

	/**
	 * Gets the strike increment for a token pair based on its spot price.
	 *
	 * @param {TokenPairOrId} pair - The token pair to fetch the strike increment for.
	 *
	 * @returns {Promise<bigint>} The strike increment for the token pair.
	 */
	async getStrikeIncrement(pair: TokenPairOrId): Promise<bigint> {
		const spotPrice = await this.getSpotPrice(pair)
		return this.premia.options.getStrikeIncrement(spotPrice)
	}

	/**
	 * Fetches data for a token pair from the subgraph.
	 * Uses caching with a one-day time-to-live.
	 *
	 * @param {TokenPairOrId} pair - The token pair or id to fetch the data for.
	 *
	 * @returns {Promise<TokenPair>} The data for the token pair.
	 */
	async getPair(pair: TokenPairOrId): Promise<TokenPair> {
		return this.premia.subgraph.getPair(pair)
	}

	/**
	 * Retrieves extended information for a token pair.
	 * Uses caching with a one-minute time-to-live.
	 *
	 * @param {TokenPairOrId} pair - The token pair to fetch the extended information for.
	 *
	 * @returns {Promise<TokenPairExtended>} The extended information for the token pair.
	 */
	async getPairExtended(pair: TokenPairOrId): Promise<TokenPairExtended> {
		return this.premia.subgraph.getPairExtended(pair)
	}

	/**
	 * Fetches data for multiple token pairs.
	 * Uses caching with a one-day time-to-live.
	 *
	 * @param {TokenPairOrId[]} pairs - An array of token pairs to fetch the data for.
	 *
	 * @returns {Promise<TokenPair[]>} The data for the specified token pairs.
	 */
	async getPairs(pairs: TokenPairOrId[]): Promise<TokenPair[]> {
		return this.premia.subgraph.getPairs(pairs)
	}

	/**
	 * Retrieves extended information for multiple token pairs.
	 * Uses caching with a one-minute time-to-live.
	 *
	 * @param {TokenPairOrId[]} pairs - An array of token pairs to fetch the extended information for.
	 *
	 * @returns {Promise<TokenPairExtended[]>} The extended information for the specified token pairs.
	 */
	async getPairsExtended(pairs: TokenPairOrId[]): Promise<TokenPairExtended[]> {
		return this.premia.subgraph.getPairsExtended(pairs)
	}
}
