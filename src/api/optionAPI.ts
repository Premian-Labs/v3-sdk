import { BigNumberish, Provider, toBigInt } from 'ethers'
import { get, isEqual } from 'lodash'

import { ZERO_BI } from '../constants'
import { FillableQuote, PoolKey, PoolMinimal, Token } from '../entities'
import { BaseAPI } from './baseAPI'
import { TokenOrAddress } from './tokenAPI'
import { parseNumber } from '../utils'
import { ONE_YEAR_MS, blackScholes } from '../'
import { roundUpTo, truncateFloat } from '../utils/round'

/**
 * This class provides an API for interacting with options in the Premia system.
 * All methods are asynchronous and return promises.
 *
 * @class OptionAPI
 * @extends {BaseAPI}
 */
export class OptionAPI extends BaseAPI {
	/**
	 * Parses a token input to return a token address string.
	 *
	 * @param {TokenOrAddress} token - The token input which can be either a Token object or a string representing the address.
	 * @returns {string} - The token address as a string.
	 */
	_parseTokenAddress(token: TokenOrAddress): string {
		let tokenAddress: string
		if (get(token, 'address')) {
			tokenAddress = (token as Token).address
		} else {
			tokenAddress = token as string
		}
		return tokenAddress
	}

	/**
	 * Filters a list of pool objects according to the provided options.
	 *
	 * @param {PoolMinimal[]} pools - An array of pool objects to filter.
	 * @param {object} options - An object containing filter conditions.
	 * @param {BigNumberish} [options.strike] - The strike price.
	 * @param {BigNumberish} [options.maturity] - The maturity time.
	 * @param {string} [options.priceOracle] - The address of the price oracle (optional).
	 * @param {string[]} [options.quoteTokens] - Array of quote tokens' addresses (optional).
	 * @returns {PoolMinimal[]} - The filtered array of pool objects.
	 */
	_filterPools(
		pools: PoolMinimal[],
		options?: {
			strike?: BigNumberish
			maturity?: BigNumberish
			priceOracle?: string
			quoteTokens?: string[]
		}
	): PoolMinimal[] {
		if (options?.maturity) {
			pools = pools.filter(
				(pool) => String(pool.maturity) === String(options.maturity)
			)
		}

		if (options?.strike) {
			pools = pools.filter(
				(pool) => String(pool.strike) === String(options.strike)
			)
		}

		if (options?.priceOracle) {
			pools = pools.filter(
				(pool) =>
					pool.pair.priceOracleAddress.toLowerCase() ===
					options.priceOracle?.toLowerCase()
			)
		}

		if (options?.quoteTokens) {
			pools = pools.filter((pool) =>
				options.quoteTokens
					?.map((token) => token.toLowerCase())
					.includes(pool.pair.quote.address.toLowerCase())
			)
		}

		return pools
	}

	/**
	 * Generates a list of suggested strike prices based on the spot price.
	 *
	 * @param {number} spotPrice - The spot price.
	 * @returns {number[]} - An array of suggested strike prices.
	 */
	getSuggestedStrikes(spotPrice: number): number[] {
		const minStrike = spotPrice / 2
		const maxStrike = spotPrice * 2

		const intervalAtMinStrike = this.getStrikeInterval(minStrike)
		const intervalAtMaxStrike = this.getStrikeInterval(maxStrike)
		const properMin = roundUpTo(minStrike, intervalAtMinStrike)
		const properMax = roundUpTo(maxStrike, intervalAtMaxStrike)

		const strikes = []
		let increment = this.getStrikeInterval(minStrike)
		for (let i = properMin; i <= properMax; i += increment) {
			increment = this.getStrikeInterval(i)
			const interval = truncateFloat(i, increment)
			strikes.push(interval)
		}

		return strikes
	}

	/**
	 * Calculates the strike interval size for a specific price.
	 *
	 * @param {number} price - The price.
	 * @returns {number} The strike interval size.
	 */
	getStrikeInterval(price: number): number {
		const orderOfTens = Math.floor(Math.log10(price))
		const base = price / 10 ** orderOfTens
		return base < 5 ? 10 ** (orderOfTens - 1) : 5 * 10 ** (orderOfTens - 1)
	}

	/**
	 * Gets the implied volatility for a given pool, price, and spot price.
	 * The implied volatility is calculated using the Black-Scholes model.
	 *
	 * @param pool {PoolMinimal} The pool object.
	 * @param price {BigNumberish} The price of the option.
	 * @param spotPrice {BigNumberish} The spot price of the underlying asset.
	 * @returns {number} The implied volatility of the option.
	 */
	getImpliedVolatility(
		pool: PoolMinimal,
		price: BigNumberish,
		spotPrice: BigNumberish
	) {
		const underlying = parseNumber(spotPrice)
		const strike = parseNumber(pool.strike)

		const iv = blackScholes.sigma({
			price: pool.isCall
				? parseNumber(price) * parseNumber(spotPrice)
				: parseNumber(price) * parseNumber(pool.strike),
			rate: 0,
			/// @dev: when underlying === strike, natural log ln(strike/underlying) = 0
			/// 	  this terminates bisection numerical method for backwards IV calculation
			/// 	  (implemented in @uqee/black-scholes library)
			strike: underlying === strike ? strike * 1.001 : strike,
			time: (Number(pool.maturity) * 1000 - Date.now()) / ONE_YEAR_MS,
			type: pool.isCall ? 'call' : 'put',
			underlying: underlying,
		})

		return iv
	}

	/**
	 * Gets the profit or loss for a given pool, action (buy/sell), and premium.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {boolean} isBuy - Whether the action is a buy.
	 * @param {BigNumberish} premium - The premium for the transaction.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the calculated profit or loss.
	 */
	async getProfitLoss(
		poolAddress: string,
		isBuy: boolean,
		premium: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const pool = await this.premia.pools.getPool(poolAddress)

		const _premium = toBigInt(premium)
		const isExpired = Number(pool.maturity) < Date.now() / 1000

		let value = ZERO_BI
		if (isExpired) {
			value = await this.premia.pools.getExerciseValue(poolAddress, provider)
		} else {
			value = await this.premia.pools.marketPrice(poolAddress, provider)
		}

		return isBuy ? value - _premium : _premium - value
	}

	/**
	 * Provides the best quote available from different sources (RFQ, Pool, Vault) based on the provided options.
	 *
	 * @param {Object} options - Quote options object.
	 * @param {string} options.poolAddress - The pool's address.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {boolean} options.isBuy - Whether the quote is a buy or sell.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @param {number} [options.maxSlippagePercent] - The maximum slippage percent (optional).
	 * @param {boolean} [options.showErrors] - Whether to show errors (optional).
	 * @param {boolean} [options.showPoolErrors] - Whether to show pool errors (optional).
	 * @param {boolean} [options.showOrderbookErrors] - Whether to show orderbook errors (optional).
	 * @param {boolean} [options.showVaultErrors] - Whether to show vault errors (optional).
	 * @returns {Promise<FillableQuote | null>} - A promise that resolves to the best quote.
	 */
	async quote(options: {
		poolAddress: string
		size: BigNumberish
		isBuy: boolean
		minimumSize?: BigNumberish
		referrer?: string
		taker?: string
		maxSlippagePercent?: number
		showErrors?: boolean
		showPoolErrors?: boolean
		showOrderbookErrors?: boolean
		showVaultErrors?: boolean
		poolKey?: PoolKey
		pool?: PoolMinimal
	}): Promise<FillableQuote> {
		const [bestRfqQuote, bestPoolQuote, bestVaultQuote] = await Promise.all([
			this.premia.orders
				.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.minimumSize,
					options.referrer,
					options.taker
				)
				.catch((e) => {
					if (options.showErrors || options.showOrderbookErrors) {
						console.error('Error getting orderbook quote', e)
					}

					return null
				}),

			this.premia.pools
				.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.referrer,
					options.taker,
					options.maxSlippagePercent,
					undefined,
					options.poolKey,
					options.pool
				)
				.catch((e) => {
					if (options.showErrors || options.showPoolErrors) {
						console.error('Error getting pool quote', e)
					}

					return null
				}),

			this.premia.vaults
				.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.minimumSize,
					options.referrer,
					options.taker,
					options.maxSlippagePercent,
					options.showVaultErrors
				)
				.catch((e) => {
					if (options.showErrors || options.showVaultErrors) {
						console.error('Error getting vault quote', e)
					}

					return null
				}),
		])

		const quotes = [bestRfqQuote, bestPoolQuote, bestVaultQuote].filter(
			(quote) => quote !== null
		) as (FillableQuote | null)[]

		return this.premia.pricing.best(
			quotes,
			options.size,
			options.minimumSize
		) as FillableQuote
	}

	/**
	 * Provides the best quotes available for each pool that matches the provided options.
	 *
	 * @param {Object} options - Multi-quote options object.
	 * @param {TokenOrAddress} options.token - The token object or address.
	 * @param {BigNumberish} options.strike - The strike price.
	 * @param {BigNumberish} options.maturity - The maturity time.
	 * @param {boolean} options.isCall - Whether the quote is for a call option.
	 * @param {boolean} options.isBuy - Whether the quote is for a buy or sell.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.priceOracle] - The address of the price oracle (optional).
	 * @param {string[]} [options.quoteTokens] - Array of quote tokens' addresses (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @returns {Promise<(FillableQuote | null)[]>} - A promise that resolves to an array of the best quotes.
	 */
	async multiQuote(options: {
		token: TokenOrAddress
		strike: BigNumberish
		maturity: BigNumberish
		isCall: boolean
		isBuy: boolean
		size: BigNumberish
		minimumSize?: BigNumberish
		priceOracle?: string
		quoteTokens?: string[]
		referrer?: string
		taker?: string
	}): Promise<(FillableQuote | null)[]> {
		const tokenAddress = this._parseTokenAddress(options.token)

		let pools: PoolMinimal[] = await this.premia.subgraph.getQuotePools(
			tokenAddress,
			options.strike,
			options.maturity,
			options.isCall
		)

		pools = this._filterPools(pools, options)

		const quotes = await Promise.all(
			pools.map(async (pool) =>
				this.quote({ ...options, poolAddress: pool.address }).catch()
			)
		)

		quotes.sort((a, b) => {
			const aIsBetter = this.premia.pricing.better(
				a,
				b,
				options.size,
				options.minimumSize
			)
			return isEqual(aIsBetter, a) ? -1 : 1
		})

		return quotes
	}

	/**
	 * Provides the best quotes available from each provider (RFQ, Pool, Vault) for each pool that matches the provided options.
	 *
	 * @param {Object} options - Quotes by provider options object.
	 * @param {TokenOrAddress} options.token - The token object or address.
	 * @param {BigNumberish} options.strike - The strike price.
	 * @param {BigNumberish} options.maturity - The maturity time.
	 * @param {boolean} options.isCall - Whether the quote is for a call option.
	 * @param {boolean} options.isBuy - Whether the quote is for a buy or sell.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.priceOracle] - The address of the price oracle (optional).
	 * @param {string[]} [options.quoteTokens] - Array of quote tokens' addresses (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @returns {Promise<{ [provider: string]: (FillableQuote | null)[] }>} - A promise that resolves to an object where each key is a provider and the value is an array of the best quotes.
	 */
	async quotesByProvider(options: {
		token: TokenOrAddress
		strike: BigNumberish
		maturity: BigNumberish
		isCall: boolean
		isBuy: boolean
		size: BigNumberish
		minimumSize?: BigNumberish
		priceOracle?: string
		quoteTokens?: string[]
		referrer?: string
		taker?: string
	}): Promise<{ [provider: string]: (FillableQuote | null)[] }> {
		const tokenAddress = this._parseTokenAddress(options.token)

		let pools: PoolMinimal[] = await this.premia.subgraph.getQuotePools(
			tokenAddress,
			options.strike,
			options.maturity,
			options.isCall
		)

		pools = this._filterPools(pools, options)

		const [poolQuotes, orderbookQuotes, vaultQuotes] = await Promise.all([
			await Promise.all(
				pools.map(async (pool) =>
					this.premia.pools
						.quote(
							pool.address,
							options.size,
							options.isBuy,
							options.referrer,
							options.taker
						)
						.catch()
				)
			),

			await Promise.all(
				pools.map(async (pool) =>
					this.premia.orders
						.quote(
							pool.address,
							options.size,
							options.isBuy,
							options.minimumSize,
							options.referrer,
							options.taker
						)
						.catch()
				)
			),

			await Promise.all(
				pools.map(async (pool) =>
					this.premia.vaults
						.quote(
							pool.address,
							options.size,
							options.isBuy,
							options.minimumSize,
							options.referrer,
							options.taker
						)
						.catch()
				)
			),
		])

		poolQuotes.sort((a, b) => {
			const aIsBetter = this.premia.pricing.better(
				a,
				b,
				options.size,
				options.minimumSize
			)
			return isEqual(aIsBetter, a) ? -1 : 1
		})

		orderbookQuotes.sort((a, b) => {
			const aIsBetter = this.premia.pricing.better(
				a,
				b,
				options.size,
				options.minimumSize
			)
			return isEqual(aIsBetter, a) ? -1 : 1
		})

		vaultQuotes.sort((a, b) => {
			const aIsBetter = this.premia.pricing.better(
				a,
				b,
				options.size,
				options.minimumSize
			)
			return isEqual(aIsBetter, a) ? -1 : 1
		})

		return {
			pool: poolQuotes,
			orderbook: orderbookQuotes,
			vault: vaultQuotes,
		}
	}

	/**
	 * Streams the best quotes available from each provider (RFQ, Pool, Vault) for the pool that matches the provided options. The best quote among all providers is updated in real-time and passed to a callback.
	 *
	 * @param {Object} options - Quote options object.
	 * @param {string} options.poolAddress - The pool address.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {boolean} options.isBuy - Whether the quote is for a buy or sell.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @param {number} [options.maxSlippagePercent] - The maximum slippage percent (optional).
	 * @param {function} callback - Function to be called when a new best quote is available.
	 * @returns {Promise<void>}
	 */
	async streamQuotes(
		options: {
			poolAddress: string
			size: BigNumberish
			isBuy: boolean
			minimumSize?: BigNumberish
			referrer?: string
			taker?: string
			maxSlippagePercent?: number
		},
		callback: (quote: FillableQuote | null) => void
	): Promise<void> {
		const bestQuotes: { [type: string]: FillableQuote | null } = {}
		const index = this.streamIndex

		const callbackIfNotStale = (quote: FillableQuote | null) => {
			if (this.streamIndex > index) return
			callback(quote)
		}

		await Promise.all([
			this.premia.orders.streamQuotes(options, (quote) => {
				bestQuotes['orderbook'] = quote

				if (
					this.premia.pricing.best(
						[quote, bestQuotes['pool'], bestQuotes['vault']],
						options.size,
						options.minimumSize
					) === quote
				) {
					callbackIfNotStale(quote)
				}
			}),

			this.premia.pools.streamQuotes(options, (quote) => {
				bestQuotes['pool'] = quote

				if (
					this.premia.pricing.best(
						[quote, bestQuotes['orderbook'], bestQuotes['vault']],
						options.size,
						options.minimumSize
					) === quote
				) {
					callbackIfNotStale(quote)
				}
			}),

			this.premia.vaults.streamQuotes(options, (quote) => {
				bestQuotes['vault'] = quote

				if (
					this.premia.pricing.best(
						[quote, bestQuotes['orderbook'], bestQuotes['pool']],
						options.size,
						options.minimumSize
					) === quote
				) {
					callbackIfNotStale(quote)
				}
			}),
		])
	}

	/**
	 * Streams best quotes available for each pool that matches the provided options. Quotes are updated in real-time and passed to a callback.
	 *
	 * @param {Object} options - Quote options object.
	 * @param {TokenOrAddress} options.token - The token object or address.
	 * @param {BigNumberish} options.strike - The strike price.
	 * @param {BigNumberish} options.maturity - The maturity time.
	 * @param {boolean} options.isCall - Whether the quote is for a call option.
	 * @param {boolean} options.isBuy - Whether the quote is for a buy or sell.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @param {number} [options.maxSlippagePercent] - The maximum slippage percent (optional).
	 * @param {string} [options.priceOracle] - The address of the price oracle (optional).
	 * @param {string[]} [options.quoteTokens] - Array of quote tokens' addresses (optional).
	 * @param {function} callback - Function to be called when new quotes are available.
	 * @returns {Promise<void>}
	 */
	async streamMultiQuotes(
		options: {
			token: TokenOrAddress
			strike: BigNumberish
			maturity: BigNumberish
			isCall: boolean
			isBuy: boolean
			size: BigNumberish
			minimumSize?: BigNumberish
			referrer?: string
			taker?: string
			maxSlippagePercent?: number
			priceOracle?: string
			quoteTokens?: string[]
		},
		callback: (quotes: (FillableQuote | null)[]) => void
	): Promise<void> {
		const tokenAddress = this._parseTokenAddress(options.token)

		let pools: PoolMinimal[] = await this.premia.subgraph.getQuotePools(
			tokenAddress,
			options.strike,
			options.maturity,
			options.isCall
		)
		pools = this._filterPools(pools, options)

		const quotesByPool: { [pool: string]: FillableQuote | null } = {}

		await Promise.all(
			pools.map(async (pool) =>
				this.streamQuotes(
					{
						poolAddress: pool.address,
						size: options.size,
						isBuy: options.isBuy,
						minimumSize: options.minimumSize,
						referrer: options.referrer,
						taker: options.taker,
						maxSlippagePercent: options.maxSlippagePercent,
					},
					async (quote) => {
						quotesByPool[pool.address] = quote

						const quotes = Object.values(quotesByPool)

						quotes.sort((a, b) => {
							const aIsBetter = this.premia.pricing.better(
								a,
								b,
								options.size,
								options.minimumSize
							)
							return isEqual(aIsBetter, a) ? -1 : 1
						})

						callback(quotes)
					}
				)
			)
		)
	}

	/**
	 * Streams best quotes available from each provider (RFQ, Pool, Vault) for each pool that matches the provided options. Quotes are updated in real-time and passed to a callback.
	 *
	 * @param {Object} options - Quote options object.
	 * @param {TokenOrAddress} options.token - The token object or address.
	 * @param {BigNumberish} options.strike - The strike price.
	 * @param {BigNumberish} options.maturity - The maturity time.
	 * @param {boolean} options.isCall - Whether the quote is for a call option.
	 * @param {boolean} options.isBuy - Whether the quote is for a buy or sell.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @param {number} [options.maxSlippagePercent] - The maximum slippage percent (optional).
	 * @param {string} [options.priceOracle] - The address of the price oracle (optional).
	 * @param {string[]} [options.quoteTokens] - Array of quote tokens' addresses (optional).
	 * @param {function} callback - Function to be called when new quotes are available.
	 * @returns {Promise<void>}
	 */
	async streamQuotesByProvider(
		options: {
			token: TokenOrAddress
			strike: BigNumberish
			maturity: BigNumberish
			isCall: boolean
			isBuy: boolean
			size: BigNumberish
			minimumSize?: BigNumberish
			referrer?: string
			taker?: string
			maxSlippagePercent?: number
			priceOracle?: string
			quoteTokens?: string[]
		},
		callback: (quotes: { [provider: string]: (FillableQuote | null)[] }) => void
	): Promise<void> {
		const tokenAddress = this._parseTokenAddress(options.token)

		let pools: PoolMinimal[] = await this.premia.subgraph.getQuotePools(
			tokenAddress,
			options.strike,
			options.maturity,
			options.isCall
		)
		pools = this._filterPools(pools, options)

		const quotesByPool: {
			[pool: string]: {
				[provider: string]: FillableQuote | null
			}
		} = {}

		const toQuotesByProvider = (byPool: typeof quotesByPool) => {
			const byProvider: {
				[provider: string]: (FillableQuote | null)[]
			} = {}

			Object.values(byPool).forEach((quotes) => {
				Object.entries(quotes).forEach(([provider, quote]) => {
					if (!byProvider[provider]) {
						byProvider[provider] = []
					}

					byProvider[provider].push(quote)
				})
			})

			return byProvider
		}

		await Promise.all(
			pools.map(async (pool) => {
				const _options = {
					poolAddress: pool.address,
					size: options.size,
					isBuy: options.isBuy,
					minimumSize: options.minimumSize,
					referrer: options.referrer,
					taker: options.taker,
					maxSlippagePercent: options.maxSlippagePercent,
				}

				if (!quotesByPool[pool.address]) {
					quotesByPool[pool.address] = {}
				}

				await Promise.all([
					this.premia.pools.streamQuotes(_options, (quote) => {
						quotesByPool[pool.address]['pool'] = quote
						callback(toQuotesByProvider(quotesByPool))
					}),

					this.premia.orders.streamQuotes(_options, (quote) => {
						quotesByPool[pool.address]['orderbook'] = quote
						callback(toQuotesByProvider(quotesByPool))
					}),

					this.premia.vaults.streamQuotes(_options, (quote) => {
						quotesByPool[pool.address]['vault'] = quote
						callback(toQuotesByProvider(quotesByPool))
					}),
				])
			})
		)
	}

	/**
	 * Cancels the streaming of quotes for the provided pool address, isCall, and isBuy parameters.
	 *
	 * @param {string} poolAddress - The pool address.
	 * @param {boolean} isCall - Whether the quote is for a call option.
	 * @param {boolean} isBuy - Whether the quote is for a buy or sell.
	 * @returns {Promise<void>}
	 */
	async cancelStreams(
		poolAddress: string,
		isCall: boolean,
		isBuy: boolean
	): Promise<void> {
		const pool: PoolMinimal = await this.premia.pools.getPoolMinimal(
			poolAddress
		)

		this.streamIndex += 1

		await Promise.all([
			/// @dev: WS API quotes design does not support multiple Redis channels subscription w/ single WS connection
			this.premia.orders.cancelAllStreams(),
			this.premia.pools.cancelQuoteStream(poolAddress),
			this.premia.vaults.cancelQuoteStream(
				[pool.pair.base.address],
				isCall,
				isBuy
			),
		])
	}

	/**
	 * Cancels all ongoing streams.
	 *
	 * @returns {Promise<void>}
	 */
	async cancelAllStreams(): Promise<void> {
		this.streamIndex += 1

		await this.premia.pools.cancelAllStreams()
		await this.premia.vaults.cancelAllStreams()
		await this.premia.orders.cancelAllStreams()
		await this.premia.cancelAllEventStreams()
	}
}
