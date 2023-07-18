import { TokenInfo } from '@premia/pair-lists/src/types'

import { withCache } from '../cache'
import { Token, TokenExtended, TokenMinimal } from '../entities'
import { Addresses, CacheTTL, WAD_DECIMALS } from '../constants'
import { BaseAPI } from './baseAPI'
import { CoingeckoTokenId } from '../services'
import { parseBigInt } from '../utils'
import { toBigInt } from 'ethers'

export type TokenOrAddress = Token | string

/**
 * Represents a class for handling Token operations related to the subgraph.
 *
 * @class TokenAPI
 * @extends {BaseAPI}
 */
export class TokenAPI extends BaseAPI {
	/**
	 * Checks if the given address corresponds to the native token on the current chain.
	 *
	 * @param {string} address - The address to check.
	 * @returns {boolean} True if the address corresponds to the native token; otherwise false.
	 */
	isNativeToken(address: string): boolean {
		return address === Addresses[this.premia.chainId].CHAINLINK_ETH
	}

	/**
	 * Checks if the given address corresponds to the wrapped native token on the current chain.
	 *
	 * @param {string} address - The address to check.
	 * @returns {boolean} True if the address corresponds to the wrapped native token; otherwise false.
	 */
	isWrappedNativeToken(address: string): boolean {
		return address === Addresses[this.premia.chainId].WETH
	}

	/**
	 * Fetches the current spot price of a given token in USD.
	 *
	 * This function retrieves the spot price for a given token from the underlying data source.
	 * If the token's USD price is not available, an error is thrown.
	 * This function is cached for a minute to prevent frequent API calls.
	 *
	 * @param {string} address - The address of the token for which to fetch the spot price.
	 *
	 * @returns {Promise<bigint>} A promise that resolves to the spot price of the token in USD.
	 *
	 * @throws {Error} An error if the USD price for the token is not found.
	 */
	@withCache(CacheTTL.MINUTE)
	async getSpotPrice(address: string): Promise<bigint> {
		const token = await this.getToken(address)

		if (!token.priceUSD) {
			throw new Error(
				`Token price not found for token: ${address} on chainId: ${this.premia.chainId}`
			)
		}

		return toBigInt(token.priceUSD)
	}

	/**
	 * Fetches minimal information of a given token including its symbol and decimals.
	 *
	 * @param {string} address - The address of the token for which to fetch the minimal information.
	 *
	 * @returns {Promise<TokenMinimal>} A promise that resolves to an object containing the token's address, symbol, and decimals.
	 */
	@withCache()
	async getTokenMinimal(address: string): Promise<TokenMinimal> {
		const tokenContract = this.premia.contracts.getTokenContract(
			address,
			this.premia.multicallProvider as any
		)
		const [symbol, decimals] = await Promise.all([
			tokenContract.symbol(),
			tokenContract.decimals(),
		])

		return {
			address,
			symbol,
			decimals: Number(decimals),
		}
	}

	/**
	 * Fetches information of a given token from subgraph, coingecko, or token contract.
	 *
	 * @param {string} address - The address of the token for which to fetch the detailed information.
	 *
	 * @returns {Promise<Token>} A promise that resolves to an object containing the token's name, symbol, decimals,
	 * whether it's native or wrapped native, price in ETH and USD, address, and chain ID.
	 *
	 * @throws Will throw an error if the token information cannot be fetched from either the subgraph, coingecko, or token contract.
	 */
	@withCache(CacheTTL.HOURLY)
	async getToken(address: string): Promise<Token> {
		if (!this.premia.skipSubgraph) {
			try {
				const token = await this.premia.subgraph.getToken(address)

				if (token) {
					return token
				}
			} catch (e) {
				console.error('Subgraph failed to load:', e)
			}
		}

		if (address === Addresses[this.premia.chainId].CHAINLINK_ETH) {
			const priceUSD = await this.premia.coingecko.getPrice(
				CoingeckoTokenId.ETH,
				'usd'
			)
			return {
				name: 'Ether',
				symbol: 'ETH',
				decimals: 18,
				address: Addresses[this.premia.chainId].CHAINLINK_ETH,
				chainId: this.premia.chainId,
				isNative: true,
				isWrappedNative: false,
				priceETH: parseBigInt('1').toString(),
				priceUSD: priceUSD ? parseBigInt(priceUSD).toString() : undefined,
			}
		}

		if (address === Addresses[this.premia.chainId].WETH) {
			const priceUSD = await this.premia.coingecko.getPrice(
				CoingeckoTokenId.WETH,
				'usd'
			)
			return {
				name: 'Wrapped Ether',
				symbol: 'WETH',
				decimals: 18,
				address: Addresses[this.premia.chainId].WETH,
				chainId: this.premia.chainId,
				isNative: false,
				isWrappedNative: true,
				priceETH: parseBigInt('1').toString(),
				priceUSD: priceUSD ? parseBigInt(priceUSD).toString() : undefined,
			}
		}

		if (address === Addresses[this.premia.chainId].CHAINLINK_USD) {
			const ethPriceUSD = await this.premia.coingecko.getPrice(
				CoingeckoTokenId.ETH,
				'usd'
			)
			return {
				name: 'US Dollar',
				symbol: 'USD',
				decimals: 8,
				address: Addresses[this.premia.chainId].CHAINLINK_USD,
				chainId: this.premia.chainId,
				isNative: false,
				isWrappedNative: false,
				priceETH: ethPriceUSD
					? (
							parseBigInt('1', 2 * Number(WAD_DECIMALS)) /
							parseBigInt(ethPriceUSD)
					  ).toString()
					: undefined,
				priceUSD: parseBigInt('1').toString(),
			}
		}

		const tokenContract = this.premia.contracts.getTokenContract(
			address,
			this.premia.multicallProvider as any
		)
		const [name, symbol, decimals, _priceETH, _priceUSD] = await Promise.all([
			tokenContract.name(),
			tokenContract.symbol(),
			tokenContract.decimals(),
			this.premia.coingecko.getPriceByAddress(
				address,
				this.premia.chainId,
				'eth'
			),
			this.premia.coingecko.getPriceByAddress(
				address,
				this.premia.chainId,
				'usd'
			),
		])
		const isNative = this.isNativeToken(address)
		const isWrappedNative = this.isWrappedNativeToken(address)
		const priceETH = _priceETH ? parseBigInt(_priceETH) : undefined
		const priceUSD = _priceUSD ? parseBigInt(_priceUSD) : undefined

		return {
			name,
			symbol,
			decimals: Number(decimals),
			address,
			chainId: this.premia.chainId,
			isNative,
			isWrappedNative,
			priceETH: priceETH?.toString(),
			priceUSD: priceUSD?.toString(),
		}
	}

	/**
	 * Fetches extended information of a given token from the subgraph.
	 *
	 * @param {string} address - The address of the token for which to fetch the extended information.
	 *
	 * @returns {Promise<TokenExtended>} A promise that resolves to an object containing the extended information of the token.
	 */
	@withCache(CacheTTL.MINUTE)
	async getTokenExtended(address: string): Promise<TokenExtended> {
		return this.premia.subgraph.getTokenExtended(address)
	}

	/**
	 * Fetches information for multiple tokens given their addresses.
	 *
	 * This function retrieves information for multiple tokens specified by an array of addresses.
	 * It uses caching with an hourly time to live to prevent frequent calls to the subgraph.
	 * If subgraph call fails, it switches to skip the subgraph and fetches the tokens' information directly.
	 *
	 * @param {string[]} tokens - An array of token addresses for which to fetch the information.
	 *
	 * @returns {Promise<Token[]>} A promise that resolves to an array containing the information of the tokens.
	 */
	@withCache(CacheTTL.HOURLY)
	async getTokens(tokens: string[]): Promise<Token[]> {
		if (!this.premia.skipSubgraph) {
			try {
				return this.premia.subgraph.getTokens(tokens)
			} catch (e) {
				console.error('Subgraph failed to load:', e)
			}
		}

		const skipSubgraph = this.premia.skipSubgraph
		this.premia.setSkipSubgraph(true)

		const _tokens = await Promise.all(
			tokens.map((token) => this.getToken(token))
		)

		this.premia.setSkipSubgraph(skipSubgraph)

		return _tokens
	}

	/**
	 * Retrieves extended information of multiple tokens given their addresses.
	 *
	 * @param {string[]} tokens - An array of token addresses for which to fetch the extended information.
	 *
	 * @returns {Promise<TokenExtended[]>} A promise that resolves to an array containing the extended
	 * information of the specified tokens.
	 */
	@withCache(CacheTTL.MINUTE)
	async getTokensExtended(tokens: string[]): Promise<TokenExtended[]> {
		return this.premia.subgraph.getTokensExtended(tokens)
	}

	/**
	 * Retrieves the information for a list of tokens given their details.
	 *
	 * This function fetches information for multiple tokens specified by an array of
	 * token information objects. If subgraph querying is not skipped and fails, the function
	 * resorts to fetching token details directly.
	 *
	 * @param {TokenInfo[]} tokenList - An array of token information objects for which to fetch the token data.
	 *
	 * @returns {Promise<Token[]>} A promise that resolves to an array containing the information of the specified tokens.
	 *
	 * @throws Will throw an error if the subgraph fails to load.
	 */
	@withCache(CacheTTL.HOURLY)
	async getTokenList(tokenList: TokenInfo[]): Promise<Token[]> {
		if (!this.premia.skipSubgraph) {
			try {
				const tokens = await this.premia.subgraph.getTokenList(tokenList)

				if (tokenList.length === tokens.length) {
					return tokens
				}
			} catch (e) {
				console.error('Subgraph failed to load:', e)
			}
		}

		const skipSubgraph = this.premia.skipSubgraph
		this.premia.setSkipSubgraph(true)

		const tokens = await Promise.all(
			tokenList.map((token) => this.getToken(token.address))
		)

		this.premia.setSkipSubgraph(skipSubgraph)

		return tokens
	}

	/**
	 * Retrieves the extended information for a list of tokens given their details.
	 *
	 * This function fetches extended information for multiple tokens specified by an array of
	 * token information objects.
	 *
	 * @param {TokenInfo[]} tokenList - An array of token information objects for which to fetch the token data.
	 *
	 * @returns {Promise<TokenExtended[]>} A promise that resolves to an array containing the extended information of the specified tokens.
	 */
	@withCache(CacheTTL.MINUTE)
	async getTokenListExtended(tokenList: TokenInfo[]): Promise<TokenExtended[]> {
		return this.premia.subgraph.getTokenListExtended(tokenList)
	}
}
