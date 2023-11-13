import { BigNumberish, ZeroAddress, parseEther, toBigInt } from 'ethers'
import { get, isEqual } from 'lodash'

import { withCache } from '../cache'
import { CacheTTL, WAD_DECIMALS, ZERO_BI } from '../constants'
import {
	FillableQuote,
	OptionType,
	Pool,
	PoolMinimal,
	Token,
	VaultTradeSide,
} from '../entities'
import { BaseAPI } from './baseAPI'
import { TokenOrAddress } from './tokenAPI'
import { roundToNearest } from '../utils/round'
import { parseBigInt, parseNumber } from '../utils'
import { ONE_YEAR_MS, TokenPairOrId, WAD_BI, blackScholes } from '../'

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
	 * Gets the profit or loss for a given pool, action (buy/sell), and premium.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {boolean} isBuy - Whether the action is a buy.
	 * @param {BigNumberish} premium - The premium for the transaction.
	 * @returns {Promise<bigint>} - A promise that resolves to the calculated profit or loss.
	 */
	async getProfitLoss(
		poolAddress: string,
		isBuy: boolean,
		premium: BigNumberish
	): Promise<bigint> {
		const pool = await this.premia.pools.getPool(poolAddress)

		const _premium = toBigInt(premium)
		const isExpired = Number(pool.maturity) < Date.now() / 1000

		let value = ZERO_BI
		if (isExpired) {
			value = await this.premia.pools.getExerciseValue(poolAddress)
		} else {
			value = await this.premia.pools.marketPrice(poolAddress)
		}

		return isBuy ? value - _premium : _premium - value
	}

	/**
	 * Calculates the increment to use for strike prices based on the spot price.
	 *
	 * @param {BigNumberish} spotPrice - The spot price.
	 * @param {number} decimals - The number of decimal places for the price (defaults to WAD_DECIMALS).
	 * @returns {bigint} - The increment for the strike prices.
	 */
	getStrikeIncrement(
		spotPrice: BigNumberish,
		decimals: number = Number(WAD_DECIMALS)
	): bigint {
		const price = parseNumber(spotPrice, decimals)
		const exponent = Math.floor(Math.log10(price))
		const multiplier = price >= 5 * 10 ** exponent ? 5 : 1
		return parseBigInt(multiplier * 10 ** (exponent - 1), decimals)
	}

	/**
	 * Generates a list of suggested strike prices based on the spot price.
	 *
	 * @param {BigNumberish} spotPrice - The spot price.
	 * @param {number} decimals - The number of decimal places for the price (defaults to WAD_DECIMALS).
	 * @returns {bigint[]} - An array of suggested strike prices.
	 */
	getSuggestedStrikes(
		spotPrice: BigNumberish,
		decimals: number = Number(WAD_DECIMALS)
	): bigint[] {
		const _spotPrice = toBigInt(spotPrice)
		let increment = this.getStrikeIncrement(spotPrice, decimals)

		if (increment === ZERO_BI) {
			return []
		}

		if (increment < parseBigInt('0.05')) {
			increment = parseBigInt('0.05')
		}

		const maxProportion = 2n

		const minStrike = _spotPrice / maxProportion
		const maxStrike = _spotPrice * maxProportion

		let minStrikeRounded = roundToNearest(minStrike, increment)
		let maxStrikeRounded = roundToNearest(maxStrike, increment)

		if (minStrikeRounded > minStrike) {
			minStrikeRounded -= increment
		}

		if (maxStrikeRounded < maxStrike) {
			maxStrikeRounded += increment
		}

		const strikes = []
		for (let i = minStrikeRounded; i <= maxStrikeRounded; i += increment) {
			strikes.push(i)
		}

		return strikes
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
	 * Gets the most liquid option for the specified base token.
	 * The liquidity is calculated using pool and vault liquidity.
	 *
	 * @returns {Promise<PoolMinimal | null>} The Pool representing the most liquid option or null if no options exist.
	 */
	@withCache(CacheTTL.HOURLY)
	async getMostLiquidOptionForToken(
		baseAddress: string,
		options: {
			isCall: boolean
			isBuy: boolean
			maturity?: BigNumberish
			strike?: BigNumberish
		}
	): Promise<Pool | null> {
		let pools = await this.premia.pools.getPools(baseAddress, false)

		pools.filter((p) => p.isCall === options.isCall)

		if (options.maturity) {
			pools = pools.filter(
				(p) => String(p.maturity) === String(options.maturity)
			)
		}

		if (options.strike) {
			pools = pools.filter((p) => String(p.strike) === String(options.strike))
		}

		if (options.isBuy) {
			const vaults = (
				await this.premia.vaults.getVaultsExtendedForToken(baseAddress, false)
			).filter(
				(v) =>
					[VaultTradeSide.Sell, VaultTradeSide.Both].includes(v.side) &&
					v.optionType === (options.isCall ? OptionType.CALL : OptionType.PUT)
			)

			const willTrade = await Promise.all(
				vaults.map(async (vault) => {
					if (!options.isBuy) return pools.map(() => false)

					const vaultContract = this.premia.contracts.getVaultContract(
						vault.address,
						this.premia.multicallProvider
					)

					return await Promise.all(
						pools.map(async (pool) => {
							try {
								const poolKey = await this.premia.pools.getPoolKeyFromAddress(
									pool.address
								)
								const quote = await vaultContract.getQuote(
									poolKey,
									parseEther('0.0001'),
									options.isBuy,
									ZeroAddress
								)
								return quote > 0n
							} catch (err) {
								console.log('Vault + Pool failed: ', vault.name, pool.name, err)
								return false
							}
						})
					)
				})
			)

			const vaultSizes = vaults.map((vault) => toBigInt(vault.totalAvailable))

			return pools.reduce((prev: Pool | null, curr: Pool, poolIndex) => {
				if (prev == null) return curr

				const prevVaultSize = vaultSizes.reduce((a, b, index) => {
					return willTrade[index][pools.indexOf(prev)] ? a + b : a
				}, 0n)

				const vaultSize = vaultSizes.reduce((a, b, index) => {
					return willTrade[index][poolIndex] ? a + b : a
				}, 0n)

				const prevSize =
					toBigInt((prev as Pool).shortLiquidity) +
					(options.isCall
						? prevVaultSize
						: (prevVaultSize * WAD_BI) / toBigInt(prev.strike))
				const currSize =
					toBigInt(curr.shortLiquidity) +
					(options.isCall
						? vaultSize
						: (vaultSize * WAD_BI) / toBigInt(curr.strike))

				if (prev != null && prevSize > currSize) {
					return prev
				}

				return curr
			}, null)
		} else {
			return pools.reduce((prev: Pool | null, curr: Pool) => {
				if (
					prev != null &&
					toBigInt((prev as Pool).longLiquidity) > toBigInt(curr.longLiquidity)
				) {
					return prev
				}

				return curr
			}, null)
		}
	}

	/**
	 * Gets the most liquid option for the specified token pair.
	 * The liquidity is calculated using pool and vault liquidity.
	 *
	 * @returns {Promise<PoolMinimal | null>} The Pool representing the most liquid option or null if no options exist.
	 */
	@withCache(CacheTTL.HOURLY)
	async getMostLiquidOptionForTokenPair(
		pair: TokenPairOrId,
		options: {
			isCall: boolean
			isBuy: boolean
			maturity?: BigNumberish
			strike?: BigNumberish
		}
	): Promise<PoolMinimal | null> {
		let [tokenPair, pools] = await Promise.all([
			this.premia.pairs.getPair(pair),
			this.premia.pools.getPoolsForPair(pair, false),
		])

		pools.filter((p) => p.isCall === options.isCall)

		if (options.maturity) {
			pools = pools.filter(
				(p) => String(p.maturity) === String(options.maturity)
			)
		}

		if (options.strike) {
			pools = pools.filter((p) => String(p.strike) === String(options.strike))
		}

		if (options.isBuy) {
			const vaults = (
				await this.premia.vaults.getVaultsExtendedForToken(
					tokenPair.base,
					false
				)
			).filter(
				(v) =>
					[VaultTradeSide.Sell, VaultTradeSide.Both].includes(v.side) &&
					v.optionType === (options.isCall ? OptionType.CALL : OptionType.PUT)
			)

			const willTrade = await Promise.all(
				vaults.map(async (vault) => {
					if (!options.isBuy) return pools.map(() => false)

					const vaultContract = this.premia.contracts.getVaultContract(
						vault.address,
						this.premia.multicallProvider
					)

					return await Promise.all(
						pools.map(async (pool) => {
							try {
								const poolKey = await this.premia.pools.getPoolKeyFromAddress(
									pool.address
								)
								const quote = await vaultContract.getQuote(
									poolKey,
									parseEther('0.0001'),
									options.isBuy,
									ZeroAddress
								)
								return quote > 0n
							} catch (err) {
								console.log('Vault + Pool failed: ', vault.name, pool.name, err)
								return false
							}
						})
					)
				})
			)

			const vaultSizes = vaults.map((vault) => toBigInt(vault.totalAvailable))

			return pools.reduce((prev: Pool | null, curr: Pool, poolIndex) => {
				if (prev == null) return curr

				const prevVaultSize = vaultSizes.reduce((a, b, index) => {
					return willTrade[index][pools.indexOf(prev)] ? a + b : a
				}, 0n)

				const vaultSize = vaultSizes.reduce((a, b, index) => {
					return willTrade[index][poolIndex] ? a + b : a
				}, 0n)

				const prevSize =
					toBigInt((prev as Pool).shortLiquidity) +
					(options.isCall
						? prevVaultSize
						: (prevVaultSize * WAD_BI) / toBigInt(prev.strike))
				const currSize =
					toBigInt(curr.shortLiquidity) +
					(options.isCall
						? vaultSize
						: (vaultSize * WAD_BI) / toBigInt(curr.strike))

				if (prev != null && prevSize > currSize) {
					return prev
				}

				return curr
			}, null)
		} else {
			return pools.reduce((prev: Pool | null, curr: Pool) => {
				if (
					prev != null &&
					toBigInt((prev as Pool).longLiquidity) > toBigInt(curr.longLiquidity)
				) {
					return prev
				}

				return curr
			}, null)
		}
	}

	/**
	 * Provides the best quote available from different sources (RFQ, Pool, Vault) based on the provided options.
	 * The method is cached for a second to improve performance.
	 *
	 * @param {Object} options - Quote options object.
	 * @param {string} options.poolAddress - The pool's address.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {boolean} options.isBuy - Whether the quote is a buy or sell.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @returns {Promise<FillableQuote | null>} - A promise that resolves to the best quote.
	 */
	@withCache(CacheTTL.SECOND)
	async quote(options: {
		poolAddress: string
		size: BigNumberish
		isBuy: boolean
		minimumSize?: BigNumberish
		referrer?: string
		taker?: string
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
				.catch(),

			this.premia.pools
				.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.referrer,
					options.taker
				)
				.catch((e) => {
					console.error('Error in getting pool quote', e)
					return null
				}),

			this.premia.vaults
				.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.minimumSize,
					options.referrer,
					options.taker
				)
				.catch(),
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
	 * The method is cached for a second to improve performance.
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
	@withCache(CacheTTL.SECOND)
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
	 * The method is cached for a second to improve performance.
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
	@withCache(CacheTTL.SECOND)
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
		},
		callback: (quote: FillableQuote | null) => void
	): Promise<void> {
		const bestQuotes: { [type: string]: FillableQuote | null } = {}

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
					callback(quote)
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
					callback(quote)
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
					callback(quote)
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
		return this.premia.cancelAllStreams()
	}
}
