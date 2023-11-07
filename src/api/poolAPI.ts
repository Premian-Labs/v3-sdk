import {
	BigNumberish,
	ContractTransaction,
	ContractTransactionResponse,
	FixedNumber,
	getAddress,
	parseEther,
	toBigInt,
	ZeroAddress,
} from 'ethers'

import { withCache } from '../cache'
import {
	AdapterType,
	FillableQuote,
	OptionType,
	OrderType,
	Pool,
	PoolExtended,
	PoolKey,
	PoolMinimal,
	PositionKey,
	Quote,
	QuoteWithSignatureT,
	Signature,
	Token,
	TokenPairMinimal,
	TokenType,
} from '../entities'
import {
	Addresses,
	CacheTTL,
	Fees,
	WAD_BI,
	WAD_DECIMALS,
	ZERO_BI,
} from '../constants'
import { Position } from '@premia/v3-abi/typechain/IPool'
import { BaseAPI } from './baseAPI'
import { convertDecimals, formatTokenId, sendTransaction } from '../utils'
import { snapToValidRange } from '../utils/range'
import { TokenPairOrId } from '..'

export enum InvalidQuoteError {
	None = 0,
	QuoteExpired = 1,
	QuoteCancelled = 2,
	QuoteOverfilled = 3,
	OutOfBoundsPrice = 4,
	InvalidQuoteTaker = 5,
	InvalidQuoteSignature = 6,
	InvalidAssetUpdate = 7,
	InsufficientCollateralAllowance = 8,
	InsufficientCollateralBalance = 9,
	InsufficientLongBalance = 10,
	InsufficientShortBalance = 11,
}

export interface ValidQuoteResponse {
	isValid: boolean
	error: string
}

/**
 * Represents a class for handling pool operations related to the subgraph and the pool contracts.
 *
 * @class PoolAPI
 * @extends {BaseAPI}
 */
export class PoolAPI extends BaseAPI {
	/**
	 * Gets the new lower and upper bounds that are snapped to the closest valid range order width.
	 * The valid range widths are multiples of 2^n*5^m.
	 *
	 * @param lower - The lower bound of the range order.
	 * @param upper - The upper bound of the range order.
	 * @param orderType - The type of the order. If it's LONG_COLLATERAL, the lower bound is adjusted;
	 *                    otherwise, the upper bound is adjusted.
	 *
	 * @returns An object with the adjusted lower and upper bounds, as bigints.
	 *          The lower and upper bounds are snapped to the closest width in validWidths (multiples of 2^n*5^m),
	 *          and are ensured to be within the bounds of minTickDistance and maxTickPrice, respectively.
	 */
	snapToValidRange(
		lower: BigNumberish,
		upper: BigNumberish,
		orderType: OrderType
	): { lower: bigint; upper: bigint } {
		return snapToValidRange(lower, upper, orderType)
	}

	/**
	 * Fetches the current market price of a specific pool using its address.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<bigint>} - Returns a promise that resolves to the market price.
	 */
	marketPrice(poolAddress: string): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.marketPrice()
	}

	/**
	 * Fetches the current spot price of a specific pool using its address.
	 *
	 * The reference oracle for the pool is used to calculate the spot price.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<bigint>} - Returns a promise that resolves to the spot price.
	 */
	async spotPrice(poolAddress: string): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()
		const oracleContract = this.premia.contracts.getOracleAdapterContract(
			poolSettings.oracleAdapter
		)
		return oracleContract.getPrice(poolSettings.base, poolSettings.quote)
	}

	/**
	 * Fetches the final settlement price of a specific pool using its address.
	 *
	 * The settlement price is the spot price of the reference oracle for the pool,
	 * at the time of the pool's expiration. This can be used to calculate the
	 * exercise price of options in the pool. The settlement price is only available
	 * after the pool has expired, otherwise 0 is returned.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<bigint>} - Returns a promise that resolves to the settlement price.
	 */
	settlementPrice(poolAddress: string): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.getSettlementPrice()
	}

	/**
	 * Determines if the market price is stranded by comparing the upper and lower bounds of the stranded area.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<boolean>} Whether the market price is stranded.
	 */
	async isMarketPriceStranded(poolAddress: string): Promise<boolean> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const strandedArea = await poolContract.getStrandedArea()
		return strandedArea.lower === strandedArea.upper
	}

	/**
	 * Gets the stranded area, defined by its lower and upper bounds.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<{ lower: bigint; upper: bigint }>} The stranded area.
	 */
	getStrandedArea(
		poolAddress: string
	): Promise<{ lower: bigint; upper: bigint }> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.getStrandedArea()
	}

	/**
	 * Returns the balance of long / short options for a given address.
	 * @param poolAddress {string} The contract address of the pool.
	 * @param userAddress {string} The address of which the long / short option balance should be queried.
	 * @param short {boolean} Whether to return the long or short balance of the address.
	 * @returns {Promise<bigint>} Promise containing the long / short option balance of the address.
	 */
	balanceOf(
		poolAddress: string,
		userAddress: string,
		short: boolean = false
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const tokenId = short ? TokenType.SHORT : TokenType.LONG
		return poolContract.balanceOf(userAddress, tokenId)
	}

	/**
	 * Retrieves the balance of a position in a specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {PositionKey} positionKey - The position identifier.
	 * @returns {Promise<bigint>} The balance of the position.
	 */
	async balanceOfRange(
		poolAddress: string,
		positionKey: PositionKey
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const tokenId = this.getTokenId(positionKey)
		return poolContract.balanceOf(
			getAddress(positionKey.owner),
			tokenId.toString()
		)
	}

	/**
	 * Resolves the referrer address. Defaults to a pre-configured referrer if none is provided.
	 *
	 * @param {string} [referrer] - The address of the referrer.
	 * @returns {string} The address of the referrer.
	 */
	toReferrer(referrer?: string) {
		return (
			referrer ?? Addresses[this.premia.chainId].DEFAULT_REFERRER ?? ZeroAddress
		)
	}

	/**
	 * Calculates the exercise value of an option from a specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<bigint>} The exercise value of the option.
	 */
	async getExerciseValue(poolAddress: string): Promise<bigint> {
		const pool = await this.getPoolMinimal(poolAddress)
		const strike = toBigInt(pool.strike)

		let settlementPrice = await this.settlementPrice(poolAddress)
		if (settlementPrice === 0n) {
			const now = Math.floor(new Date().getTime() / 1000)
			const oracleContract = this.premia.contracts.getOracleAdapterContract(
				pool.pair.priceOracleAddress
			)

			if (now < Number(pool.maturity)) {
				settlementPrice = await oracleContract.getPrice(
					pool.pair.base.address,
					pool.pair.quote.address
				)
			} else {
				settlementPrice = await oracleContract.getPriceAt(
					pool.pair.base.address,
					pool.pair.quote.address,
					pool.maturity
				)
			}
		}

		if (pool.isCall) {
			return settlementPrice > strike
				? ((settlementPrice - strike) * WAD_BI) / settlementPrice
				: 0n
		} else {
			return settlementPrice < strike ? strike - settlementPrice : 0n
		}
	}

	/**
	 * Computes the breakeven price for an option.
	 * @param strike {BigNumberish} The strike price.
	 * @param isCall {boolean} Whether the option is a call or put.
	 * @param price {BigNumberish} The price that was paid for the option in terms of the quote.
	 * @param spotPrice {BigNumberish} The spot price at the time of purchase.
	 * @param isFullPrice {boolean} Whether the option price is not normalized.
	 * @returns {bigint} The breakeven spot price at expiration.
	 */
	getBreakevenPrice(
		strike: BigNumberish,
		isCall: boolean,
		price: BigNumberish,
		spotPrice: BigNumberish,
		isFullPrice: boolean = false
	): bigint {
		const _strike = FixedNumber.fromValue(strike, 18)
		const _spot = FixedNumber.fromValue(spotPrice, 18)
		const _price = FixedNumber.fromValue(price, 18)
		let fullPrice = isCall ? _price.mul(_spot) : _price.mul(_strike)

		if (isFullPrice) {
			fullPrice = _price
		}

		/// @dev: Since call options are denominated in the base token, the
		//  breakeven price requires calculating the change in spot price
		//	value of the price paid for the option.
		if (isCall) {
			return _strike
				.add(fullPrice)
				.sub(
					fullPrice
						.mul(_strike.add(fullPrice).sub(_spot))
						.div(fullPrice.sub(_spot))
				).value
		}

		/// @dev: Put options don't require calculating the change in value
		//  because they are denominated in the quote token, whose price is
		// 	unaffected by the spot price of the base token.
		return _strike.sub(fullPrice).value
	}

	/**
	 * Generates a token ID from a position key.
	 *
	 * @param {PositionKey} positionKey - The key identifying the position.
	 * @returns {bigint} The generated token ID.
	 */
	getTokenId(positionKey: PositionKey): bigint {
		return formatTokenId({ ...positionKey })
	}

	/**
	 * Returns the contract address of a pool corresponding to a PoolKey.
	 * @param key {PoolKey} The pool key.
	 * @returns {Promise<string>} Promise containing the contract address if it exists.
	 */
	async getPoolAddress(key: PoolKey): Promise<string> {
		const factoryContract = this.premia.contracts.getPoolFactoryContract()
		const response = await factoryContract.getPoolAddress(key)
		return response.pool
	}

	/**
	 * Returns the fee charged to initialize a pool corresponding to the supplied PoolKey.
	 * @param key {PoolKey} The relevant pool key.
	 * @returns {Promise<bigint>} Promise containing the
	 */
	async initializationFee(key: PoolKey): Promise<bigint> {
		const factory = await this.premia.contracts.getPoolFactoryContract()
		return factory.initializationFee(key)
	}

	/**
	 * Returns the takerFee charged when trading with the pool.
	 * @param poolAddress {string} The contract address of the relevant pool.
	 * @param size {bigint} The amount of contracts to be bought / sold.
	 * @param premium {bigint} The premium paid for the contracts .
	 * @param isPremiumNormalized {isPremiumNormalized} Whether the premium is normalized. Relevant for put options where the price can be quoted normalized, which is the price divided by the strike, or unnormalized.
	 * @param taker {string} The taker's address. Relevant in case staking discounts apply. Default: ZeroAddress.
	 * @returns {Promise<bigint>} Promise containing the taker fee charged for trading on the exchange,
	 * 							  denominated in the pool token.
	 */
	async takerFee(
		poolAddress: string,
		size: bigint,
		premium: bigint,
		isPremiumNormalized: boolean = false,
		isOrderbook: boolean = false,
		taker?: string
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)

		const poolDiamond = this.premia.contracts.getPoolDiamondContract()
		const [_feeFromPoolContract, _poolKey] = await Promise.allSettled([
			poolContract.takerFee(
				taker ?? ZeroAddress,
				size,
				premium,
				isPremiumNormalized,
				isOrderbook
			),
			this.getPoolKeyFromAddress(poolAddress),
		])

		if (_feeFromPoolContract.status === 'fulfilled') {
			return _feeFromPoolContract.value
		}

		if (_poolKey.status === 'rejected') {
			return this.takerFeeSync(size, premium, isOrderbook)
		}

		const poolKey = _poolKey.value

		const tokenContract = this.premia.contracts.getTokenContract(
			poolKey.isCallPool ? poolKey.base : poolKey.quote
		)

		const [_takerFee, tokenDecimals] = await Promise.all([
			poolDiamond._takerFeeLowLevel(
				taker ?? ZeroAddress,
				size,
				premium,
				isPremiumNormalized,
				isOrderbook,
				poolKey.strike,
				poolKey.isCallPool
			),

			tokenContract.decimals(),
		])

		return convertDecimals(_takerFee, WAD_DECIMALS, tokenDecimals)
	}

	/**
	 * Returns the takerFee charged when trading with the pool.
	 * Calculated synchronously (may be outdated, does not include taker discounts)
	 * @param poolAddress {string} The contract address of the relevant pool.
	 * @param size {bigint} The amount of contracts to be bought / sold.
	 * @param premiumWad {bigint} The non-normalized premium paid for the contracts.
	 * @param isOrderbook  {boolean} Whether the trade is an orderbook trade.
	 * @returns {bigint} The taker fee charged for trading on the exchange denominated in 18 decimals.
	 */
	takerFeeSync(size: bigint, premiumWad: bigint, isOrderbook: boolean = false) {
		if (isOrderbook) {
			const sizeBased = (Fees.ORDERBOOK_NOTIONAL_FEE_PERCENT * size) / WAD_BI
			const maxFee = (Fees.MAX_PREMIUM_FEE_PERCENT * premiumWad) / WAD_BI
			return sizeBased > maxFee ? maxFee : sizeBased
		}

		const sizeBased = (size * Fees.NOTIONAL_FEE_PERCENT) / WAD_BI
		const premiumBased = (premiumWad * Fees.PREMIUM_FEE_PERCENT) / WAD_BI
		const maxFee =
			premiumWad === ZERO_BI
				? sizeBased
				: (Fees.MAX_PREMIUM_FEE_PERCENT * premiumWad) / WAD_BI

		const fee = sizeBased > premiumBased ? sizeBased : premiumBased
		return fee > maxFee ? maxFee : fee
	}

	/**
	 * Validates a quote for its correctness.
	 *
	 * @param {QuoteWithSignatureT} quote - The quote with the signature to validate.
	 * @param {Object} [options] - Additional options for validation.
	 * @param {string} [options.poolAddress] - The address of the Pool contract.
	 * @param {BigNumberish} [options.size] - The size of the quote.
	 * @returns {Promise<ValidQuoteResponse>} A promise that resolves to the validation result with error information if the quote is invalid.
	 */
	async isQuoteValid(
		quote: QuoteWithSignatureT,
		options?: {
			taker?: string
			poolAddress?: string
			size?: BigNumberish
		}
	): Promise<ValidQuoteResponse> {
		let _poolAddress = options?.poolAddress

		if (!_poolAddress) {
			const factoryContract = this.premia.contracts.getPoolFactoryContract()
			const response = await factoryContract.getPoolAddress(quote.poolKey)
			_poolAddress = response.pool
		}

		const pool = this.premia.contracts.getPoolContract(_poolAddress)

		try {
			const response = await pool.isQuoteOBValid(
				options?.taker ?? ZeroAddress,
				{
					provider: quote.provider,
					taker: quote.taker,
					price: quote.price.toString(),
					size: quote.size.toString(),
					isBuy: quote.isBuy,
					deadline: quote.deadline.toString(),
					salt: quote.salt.toString(),
				},
				(options?.size ?? quote.size).toString(),
				quote.signature
			)

			const [isValid, error] = response

			return {
				isValid,
				error: InvalidQuoteError[Number(error)],
			}
		} catch (err) {
			console.error("ERROR: Couldn't validate quote", err)
			return {
				isValid: false,
				error: InvalidQuoteError[InvalidQuoteError.None],
			}
		}
	}

	/**
	 * Requests a quote from the pool with optional parameters.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {BigNumberish} size - The size of the quote.
	 * @param {boolean} isBuy - Whether it's a buy or sell.
	 * @param {string} [referrer] - The address of the referrer.
	 * @param {string} [taker] - The address of the taker.
	 * @param {Number} [maxSlippagePercent] - The maximum slippage percent.
	 * @returns {Promise<FillableQuote>} A promise that resolves to the fillable quote.
	 */
	@withCache(CacheTTL.SECOND)
	async quote(
		poolAddress: string,
		size: BigNumberish,
		isBuy: boolean,
		referrer?: string,
		taker?: string,
		maxSlippagePercent?: Number
	): Promise<FillableQuote> {
		const _size = toBigInt(size)
		const pool = this.premia.contracts.getPoolContract(poolAddress)
		const [poolKey, quote] = await Promise.all([
			this.getPoolKeyFromAddress(poolAddress),
			pool.getQuoteAMM(taker ?? ZeroAddress, _size, isBuy),
		])
		const premiumLimit = maxSlippagePercent
			? this.premia.pricing.premiumLimit(
					quote.premiumNet,
					maxSlippagePercent,
					isBuy
			  )
			: quote.premiumNet

		return {
			poolKey,
			poolAddress,
			provider: poolAddress,
			taker: ZeroAddress,
			price: (quote.premiumNet * WAD_BI) / _size,
			size: _size,
			isBuy: !isBuy,
			deadline: toBigInt(Math.floor(new Date().getTime() / 1000 + 60 * 60)),
			takerFee: quote.takerFee,
			approvalTarget: Addresses[this.premia.chainId].ERC20_ROUTER,
			approvalAmount: isBuy
				? premiumLimit
				: _size - premiumLimit + quote.takerFee,
			to: poolAddress,
			data: pool.interface.encodeFunctionData('trade', [
				_size,
				isBuy,
				premiumLimit,
				this.toReferrer(referrer),
			]),
		}
	}

	/**
	 * Streams quotes for a specified size and direction (buy/sell).
	 *
	 * @param {Object} options - The options for the quote stream.
	 * @param {string} options.poolAddress - The address of the pool.
	 * @param {BigNumberish} options.size - The size of the quote.
	 * @param {boolean} options.isBuy - Whether it's a buy or sell.
	 * @param {(quote: FillableQuote | null) => void} callback - The callback function to handle each new quote.
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
		const pool = this.premia.contracts.getPoolContract(options.poolAddress)

		try {
			const bestQuote = await this.quote(
				options.poolAddress,
				options.size,
				options.isBuy,
				options.referrer,
				options.taker
			).catch()
			callback(bestQuote)
		} catch (e) {
			console.error('Error getting quote from pool: ', e)
			callback(null)
		}

		pool.on(pool.filters.Trade, async () => {
			try {
				const quote = await this.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.referrer,
					options.taker
				).catch()
				callback(quote)
			} catch (e) {
				console.error('Error getting quote from pool: ', e)
				callback(null)
			}
		})
	}

	/**
	 * Cancels the quote stream for a given pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<void>}
	 */
	async cancelQuoteStream(poolAddress: string): Promise<void> {
		const pool = this.premia.contracts.getPoolContract(poolAddress)
		pool.on(pool.filters.Trade, () => null)
	}

	/**
	 * Returns the PoolKey given the contract address of a pool.
	 * @param poolAddress {string} The contract address of the relevant pool.
	 * @returns {Promise<PoolKey>}
	 */
	async getPoolKeyFromAddress(poolAddress: string): Promise<PoolKey> {
		const poolContract = this.premia.contracts.getPoolContract(
			poolAddress,
			this.premia.multicallProvider
		)
		const poolSettings = await poolContract.getPoolSettings()

		return {
			base: poolSettings.base,
			quote: poolSettings.quote,
			oracleAdapter: poolSettings.oracleAdapter,
			strike: poolSettings.strike,
			maturity: poolSettings.maturity,
			isCallPool: poolSettings.isCallPool,
		}
	}

	/**
	 * Returns the corresponding PoolMinimal object from a PoolKey.
	 * @param key {PoolKey} The relevant PoolKey.
	 * @returns {Promise<PoolMinimal>} Promise containing PoolMinimal.
	 */
	@withCache(CacheTTL.DAILY)
	async getPoolMinimalFromKey(key: PoolKey): Promise<PoolMinimal> {
		const address = await this.getPoolAddress(key)
		let initialized = false

		try {
			const poolContract = this.premia.contracts.getPoolContract(address)
			const deployed = await poolContract.getDeployedCode()
			initialized = deployed !== null
		} catch (err) {}

		const oracleContract = await this.premia.contracts.getOracleAdapterContract(
			key.oracleAdapter
		)
		const [base, quote, basePricingPath, quotePricingPath] = await Promise.all([
			this.premia.tokens.getTokenMinimal(key.base),
			this.premia.tokens.getTokenMinimal(key.quote),

			oracleContract.describePricingPath(key.base),
			oracleContract.describePricingPath(key.quote),
		])
		const baseAdapterType = Object.keys(AdapterType)[
			Number(basePricingPath.adapterType)
		] as AdapterType
		const quoteAdapterType = Object.keys(AdapterType)[
			Number(quotePricingPath.adapterType)
		] as AdapterType

		return {
			initialized,
			address,
			factory: {
				address: this.premia.contracts.poolFactoryAddress,
			},
			pair: {
				name: `${base.symbol}/${quote.symbol}`,
				base,
				quote,
				priceOracleAddress: key.oracleAdapter,
			},
			baseAdapterType,
			quoteAdapterType,
			collateralAsset: key.isCallPool ? base : quote,
			optionType: key.isCallPool ? OptionType.CALL : OptionType.PUT,
			isCall: key.isCallPool,
			strike: key.strike,
			maturity: key.maturity,
		}
	}

	/**
	 * Returns the corresponding PoolMinimal object from the contract address of a pool.
	 *
	 * @param address {string} The relevant contract address.
	 * @returns {Promise<PoolMinimal>} Promise containing PoolMinimal.
	 */
	@withCache(CacheTTL.DAILY)
	async getPoolMinimal(address: string): Promise<PoolMinimal> {
		return this.premia.subgraph.getPoolMinimal(address)
	}

	/**
	 * Retrieves the pool information given its address. Cached daily.
	 *
	 * @param {string} address - The address of the pool.
	 * @returns {Promise<Pool>} A promise that resolves to a `Pool` object.
	 */
	@withCache(CacheTTL.DAILY)
	async getPool(address: string): Promise<Pool> {
		return this.premia.subgraph.getPool(address)
	}

	/**
	 * Retrieves extended pool information given its address. Cached per minute.
	 *
	 * @param {string} address - The address of the Pool contract.
	 * @returns {Promise<PoolExtended>} A promise that resolves to a `PoolExtended` objects.
	 */
	@withCache(CacheTTL.MINUTE)
	async getPoolExtended(address: string): Promise<PoolExtended> {
		return this.premia.subgraph.getPoolExtended(address)
	}

	/**
	 * Retrieves pools based on the base address. Cached daily.
	 *
	 * @param {string} baseAddress - The address of the base token.
	 * @param {boolean} isExpired - A filter for [non-] expired pools.
	 * @returns {Promise<Pool[]>} A promise that resolves to an array of `Pool` objects.
	 */
	@withCache(CacheTTL.DAILY)
	async getPools(baseAddress: string, isExpired?: boolean): Promise<Pool[]> {
		return this.premia.subgraph.getPools(baseAddress, isExpired)
	}

	/**
	 * Retrieves extended pools based on the base address. Cached daily.
	 *
	 * @param {string} baseAddress - The address of the base token.
	 * @param {boolean} isExpired - A filter for [non-] expired pools.
	 * @returns {Promise<PoolExtended[]>} A promise that resolves to an array of `PoolExtended` objects.
	 */
	@withCache(CacheTTL.MINUTE)
	async getPoolsExtended(
		baseAddress: string,
		isExpired?: boolean
	): Promise<PoolExtended[]> {
		return this.premia.subgraph.getPoolsExtended(baseAddress, isExpired)
	}

	/**
	 * Retrieves pools for a given token. Cached daily.
	 *
	 * @param {Token} token - The token information.
	 * @param {boolean} [isQuote=false] - A flag to indicate if the token is quote token.
	 * @returns {Promise<Pool[]>} A promise that resolves to an array of `Pool` objects.
	 */
	@withCache(CacheTTL.DAILY)
	async getPoolsForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<Pool[]> {
		return this.premia.subgraph.getPoolsForToken(token, isQuote)
	}

	/**
	 * Retrieves extended pools for a given token. Cached per minute.
	 *
	 * @param {Token} token - The token information.
	 * @param {boolean} [isQuote=false] - A flag to indicate if the token is quote token.
	 * @returns {Promise<PoolExtended[]>} A promise that resolves to an array of `PoolExtended` objects.
	 */
	@withCache(CacheTTL.MINUTE)
	async getPoolsExtendedForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<PoolExtended[]> {
		return this.premia.subgraph.getPoolsExtendedForToken(token, isQuote)
	}

	/**
	 * Retrieves pools for a given token pair. Cached daily.
	 *
	 * @param {TokenPairOrId} pair - The token pair or pair id.
	 * @param {boolean} isExpired - A filter for [non-] expired pools.
	 * @returns {Promise<Pool[]>} A promise that resolves to an array of `Pool` objects.
	 */
	@withCache(CacheTTL.DAILY)
	async getPoolsForPair(
		pair: TokenPairOrId,
		isExpired?: boolean
	): Promise<Pool[]> {
		return this.premia.subgraph.getPoolsForPair(pair, isExpired)
	}

	/**
	 * Retrieves extended pools for a given token pair. Cached per minute.
	 *
	 * @param {TokenPairOrId} pair - The token pair or pair id.
	 * @param {boolean} isExpired - A filter for [non-] expired pools.
	 * @returns {Promise<PoolExtended[]>} A promise that resolves to an array of `PoolExtended` objects.
	 */
	@withCache(CacheTTL.MINUTE)
	async getPoolsExtendedForPair(
		pair: TokenPairOrId,
		isExpired?: boolean
	): Promise<PoolExtended[]> {
		return this.premia.subgraph.getPoolsExtendedForPair(pair, { isExpired })
	}

	/**
	 * Returns a promise containing a populated transaction to deploy a pool parametrized by the input parameters. Allows SDK users to sign the transaction without providing a signer.
	 * @param base {string} Contract address of the base token.
	 * @param quote {string} Contract address of the quote token.
	 * @param oracleAdapter {string} Contract address of the oracleAdapter.
	 * @param strike {BigNumberish} Strike of the pool; denominated in the quote token.
	 * @param maturity {BigNumberish} Maturity of the pool (UNIX timestamp).
	 * @param isCall {boolean} Whether the pool supports call or put options.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeDeploy(
		base: string,
		quote: string,
		oracleAdapter: string,
		strike: BigNumberish,
		maturity: BigNumberish,
		isCall: boolean
	): Promise<ContractTransaction> {
		return this.encodeDeployWithKey({
			base,
			quote,
			oracleAdapter,
			strike: toBigInt(strike),
			maturity: toBigInt(maturity),
			isCallPool: isCall,
		})
	}

	/**
	 * Returns the promise containing a transaction to deploy a pool parametrized by the input parameters.
	 * @param base {string} Contract address of the base token.
	 * @param quote {string} Contract address of the quote token.
	 * @param oracleAdapter {string} Contract address of the oracleAdapter.
	 * @param strike {BigNumberish} Strike of the pool; denominated in the quote token.
	 * @param maturity {BigNumberish} Maturity of the pool (UNIX timestamp).
	 * @param isCall {boolean} Whether the pool supports call or put options.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async deploy(
		base: string,
		quote: string,
		oracleAdapter: string,
		strike: BigNumberish,
		maturity: BigNumberish,
		isCall: boolean
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolFactoryContract(),
			this.encodeDeploy(base, quote, oracleAdapter, strike, maturity, isCall),
			'encodeDeploy'
		)
	}

	/**
	 * Returns the promise containing a populated transaction to deploy a pool parametrized by the PoolKey. Allows SDK users to sign the transaction without providing a signer.
	 * @param key {PoolKey} PoolKey containing parameters of the pool to be deployed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeDeployWithKey(key: PoolKey): Promise<ContractTransaction> {
		const factory = this.premia.contracts.getPoolFactoryContract()
		const value = await factory.initializationFee(key)
		return factory.deployPool.populateTransaction(key, {
			value: value + value / 10n, // Add 5% to fix rounding errors, it will be refunded
		})
	}

	/**
	 * Returns the promise containing a transaction to deploy a pool parametrized by the PoolKey.
	 * @param key {PoolKey} PoolKey containing parameters of the pool to be deployed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async deployWithKey(key: PoolKey): Promise<ContractTransactionResponse> {
		const factory = this.premia.contracts.getPoolFactoryContract()

		let [, isDeployed] = await factory.getPoolAddress(key)

		if (isDeployed) {
			throw new Error('Pool is already deployed.')
		}

		return factory.deployPool(key, {
			value: parseEther('1'), // Possibly fix later, is there a better estimate?
		})
	}

	/**
	 * Returns the promise containing a populated transaction to make a deposit parametrized by the inputs. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeDeposit(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			size,
			orderType,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			size: BigNumberish
			orderType: OrderType
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}

		console.log('Pool address: ', poolAddress)
		console.log('Getting ticks: ', [lower, upper])

		const ticks = await poolContract.getNearestTicksBelow(lower, upper)

		console.log('Deposit: ', [
			positionKey,
			ticks.nearestBelowLower,
			ticks.nearestBelowUpper,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			),
		])

		return poolContract[
			'deposit((address,address,uint256,uint256,uint8),uint256,uint256,uint256,uint256,uint256)'
		].populateTransaction(
			positionKey,
			ticks.nearestBelowLower,
			ticks.nearestBelowUpper,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing a signed transaction to make a deposit parametrized by the inputs.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async deposit(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			size,
			orderType,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			size: BigNumberish
			orderType: OrderType
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeDeposit(poolAddress, {
				owner,
				lower,
				upper,
				size,
				orderType,
				operator,
				minMarketPrice,
				maxMarketPrice,
			}),
			'encodeDeposit'
		)
	}

	/**
	 * Returns the promise containing a populated transaction to make a deposit parametrized by the inputs. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeDepositWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const ticks = await poolContract.getNearestTicksBelow(
			positionKey.lower,
			positionKey.upper
		)

		return poolContract[
			'deposit((address,address,uint256,uint256,uint8),uint256,uint256,uint256,uint256,uint256)'
		].populateTransaction(
			positionKey,
			ticks.nearestBelowLower,
			ticks.nearestBelowUpper,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing a signed transaction to make a deposit parametrized by the inputs.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async depositWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeDepositWithKey(poolAddress, {
				positionKey,
				size,
				minMarketPrice,
				maxMarketPrice,
			}),
			'encodeDepositWithKey'
		)
	}

	/**
	 * Returns a promise containing the range order position's delta struct that would be transferred from the user to the pool upon deposit. The delta struct contains the amount of collateral / longs / shorts transferred to the pool when the deposit is executed given the current market price.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.* @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @returns {Promise<Position.DeltaStructOutput>} Promise containing the position's delta struct.
	 */
	async previewDeposit(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			size,
			orderType,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			size: BigNumberish
			orderType: OrderType
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<Position.DeltaStructOutput> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}

		return this.previewDepositWithKey(poolAddress, {
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		})
	}

	/**
	 * Returns a promise containing the range order position's delta struct that would be transferred from the user to the pool upon deposit. The delta struct contains the amount of collateral / longs / shorts transferred to the pool when the deposit is executed given the current market price.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be deposited.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the deposit to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the deposit to be processed.
	 * @returns {Promise<Position.DeltaStructOutput>} Promise containing the position's delta struct.
	 */
	async previewDepositWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<Position.DeltaStructOutput> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const ticks = await poolContract.getNearestTicksBelow(
			positionKey.lower,
			positionKey.upper
		)

		return poolContract[
			'deposit((address,address,uint256,uint256,uint8),uint256,uint256,uint256,uint256,uint256)'
		].staticCall(
			positionKey,
			ticks.nearestBelowLower,
			ticks.nearestBelowUpper,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing a populated transaction to make a withdrawal parametrized through the input parameters. Allows users to use the SDK without a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withdrawal to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeWithdraw(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			size,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			size: BigNumberish
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}
		return poolContract.withdraw.populateTransaction(
			positionKey,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing a signed transaction to make a withdrawal parametrized through the input parameters.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withrawal to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async withdraw(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			size,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			size: BigNumberish
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeWithdraw(poolAddress, {
				owner,
				lower,
				upper,
				orderType,
				size,
				operator,
				minMarketPrice,
				maxMarketPrice,
			}),
			'encodeWithdraw'
		)
	}

	/**
	 * Returns the promise containing a populated transaction to make a withdrawal parametrized by the PositionKey. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withdrawal to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeWithdrawWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		return poolContract.withdraw.populateTransaction(
			positionKey,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing a signed transaction to make a withdrawal parametrized by the PositionKey.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withdrawal to be processed.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async withdrawWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeWithdrawWithKey(poolAddress, {
				positionKey,
				size,
				minMarketPrice,
				maxMarketPrice,
			}),
			'encodeWithdrawWithKey'
		)
	}

	/**
	 * Returns the promise containing the range order position's delta struct. The delta struct contains the amount of collateral / longs / shorts received when the withdrawal is executed given the current market price.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withrawal to be processed.
	 * @returns {Promise<Position.DeltaStructOutput>} Promise containing the position's delta struct.
	 */
	async previewWithdraw(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			size,
			orderType,
			operator,
			minMarketPrice,
			maxMarketPrice,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			size: BigNumberish
			orderType: OrderType
			operator?: string
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<Position.DeltaStructOutput> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}
		return this.previewWithdrawWithKey(poolAddress, {
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		})
	}

	/**
	 * Returns the promise containing the range order position's delta struct. The delta struct contains the amount of collateral / longs / shorts received when the withdrawal is executed given the current market price.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @param size {BigNumberish} The amount of liquidity denominated in options contracts to be withdrawn.
	 * @param minMarketPrice {BigNumberish} Optional argument specifying the minimum admissible market price for the withdrawal to be processed.
	 * @param maxMarketPrice {BigNumberish} Optional argument specifying the maximum admissible market price for the withdrawal to be processed.
	 * @returns {Promise<Position.DeltaStructOutput>} Promise containing the position's delta struct.
	 */
	async previewWithdrawWithKey(
		poolAddress: string,
		{
			positionKey,
			size,
			minMarketPrice,
			maxMarketPrice,
		}: {
			positionKey: PositionKey
			size: BigNumberish
			minMarketPrice?: BigNumberish
			maxMarketPrice?: BigNumberish
		}
	): Promise<Position.DeltaStructOutput> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		return poolContract.withdraw.staticCall(
			positionKey,
			size,
			toBigInt(minMarketPrice || 0),
			toBigInt(
				maxMarketPrice ||
					(poolSettings.isCallPool ? WAD_BI : poolSettings.strike)
			)
		)
	}

	/**
	 * Returns the promise containing the amount of fees that are claimable.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @returns {Promise<bigint>} Promise containing the amount of claimable fees.
	 */
	async getClaimableFees(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}

		return this.getClaimableFeesWithKey(poolAddress, positionKey)
	}

	/**
	 * Returns the promise containing the amount of fees that are claimable.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param key {PositionKey} PositionKey parametrizing the range order.
	 * @returns {Promise<bigint>} Promise containing the amount of claimable fees.
	 */
	async getClaimableFeesWithKey(
		poolAddress: string,
		key: PositionKey
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.getClaimableFees(key)
	}

	/**
	 * Returns a promise containing a populated transaction to make claim fees generated by a range order. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeClaim(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}
		return this.encodeClaimWithKey(poolAddress, positionKey)
	}

	/**
	 * Returns a promise containing a signed transaction to make claim fees generated by a range order. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async claim(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeClaim(poolAddress, {
				owner,
				lower,
				upper,
				orderType,
				operator,
			}),
			'encodeClaim'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to claim fees generated by the range order specified by the PositionKey. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param key {PositionKey} PositionKey parametrizing the range order.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeClaimWithKey(
		poolAddress: string,
		key: PositionKey
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.claim.populateTransaction(key)
	}

	/**
	 * Returns a promise containing a signed transaction to claim fees generated by the range order specified by the PositionKey. Allows the SDK to be used without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param key {PositionKey} PositionKey parametrizing the range order.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async claimWithKey(
		poolAddress: string,
		key: PositionKey
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeClaimWithKey(poolAddress, key),
			'encodeClaimWithKey'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to underwrite an option. The option's strike and maturity are specified through the contract address of the pool. Allows users to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param underwriter {string} Address of the underwriter receiving the short options.
	 * @param longReceiver {string} Address receiving the long options.
	 * @param size {BigNumberish} Amount of options to be underwritten (minted).
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeWriteOption(
		poolAddress: string,
		{
			underwriter,
			longReceiver,
			size,
			referrer,
		}: {
			underwriter: string
			size: BigNumberish
			longReceiver?: string
			referrer?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const _longReceiver = longReceiver ? longReceiver : underwriter
		return poolContract.writeFrom.populateTransaction(
			underwriter,
			_longReceiver,
			size,
			this.toReferrer(referrer)
		)
	}

	/**
	 * Returns a promise containing a signed transaction to underwrite an option. The option's strike and maturity are specified through the contract address of the pool.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param underwriter {string} Address of the underwriter receiving the short options.
	 * @param longReceiver {string} Address receiving the long options.
	 * @param size {BigNumberish} Amount of options to be underwritten (minted).
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async writeOption(
		poolAddress: string,
		{
			underwriter,
			longReceiver,
			size,
		}: {
			underwriter: string
			size: BigNumberish
			longReceiver?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeWriteOption(poolAddress, {
				underwriter,
				longReceiver,
				size,
			}),
			'encodeWriteOption'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to trade options. Allows users to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to buy / sell.
	 * @param isBuy {boolean} Whether to buy or sell options.
	 * @param premiumLimit {BigNumberish} If isBuy is true the premiumLimit is the maximum amount to be spent to buy the option amount. If isBuy is false the premiumLimit is the minimum amount received for selling the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeTrade(
		poolAddress: string,
		{
			size,
			isBuy,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			isBuy: boolean
			premiumLimit: BigNumberish
			referrer: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.trade.populateTransaction(
			toBigInt(size),
			isBuy,
			toBigInt(premiumLimit),
			referrer
		)
	}

	/**
	 * Returns a promise containing a signed transaction to trade options.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to buy / sell.
	 * @param isBuy {boolean} Whether to buy or sell options.
	 * @param premiumLimit {BigNumberish} If isBuy is true the premiumLimit is the maximum amount to be spent to buy the option amount. If isBuy is false the premiumLimit is the minimum amount received for selling the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async trade(
		poolAddress: string,
		{
			size,
			isBuy,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			isBuy: boolean
			premiumLimit: BigNumberish
			referrer: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeTrade(poolAddress, {
				size,
				isBuy,
				premiumLimit,
				referrer,
			}),
			'encodeTrade'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to buy options. Allows users to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to buy.
	 * @param premiumLimit {BigNumberish} The premiumLimit is the maximum amount to be spent to buy the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeBuy(
		poolAddress: string,
		{
			size,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.trade.populateTransaction(
			size,
			true,
			toBigInt(premiumLimit),
			this.toReferrer(referrer)
		)
	}

	/**
	 * Returns a promise containing a signed transaction to buy options. Buying options can be in the form of buying long options positions or buying to close short option positions.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to buy.
	 * @param premiumLimit {BigNumberish} The premiumLimit is the maximum amount to be spent to buy the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async buy(
		poolAddress: string,
		{
			size,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeBuy(poolAddress, {
				size,
				premiumLimit,
				referrer,
			}),
			'encodeBuy'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to sell options. Selling options can be in the form of selling long option positions or selling to open short positions. Allows users to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to sell.
	 * @param premiumLimit {BigNumberish} The premiumLimit is the minimum amount to be received to sell the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSell(
		poolAddress: string,
		{
			size,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const _premiumLimit = toBigInt(premiumLimit)
		return poolContract.trade.populateTransaction(
			size,
			false,
			_premiumLimit,
			this.toReferrer(referrer)
		)
	}

	/**
	 * Returns a promise containing a signed transaction to sell options. Selling options can be in the form of selling long option positions or selling to open short positions.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} The amount of options to sell.
	 * @param premiumLimit {BigNumberish} The premiumLimit is the minimum amount to be received to sell the option amount.
	 * @param referrer {string} Address of the referrer // todo: specify
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async sell(
		poolAddress: string,
		{
			size,
			premiumLimit,
			referrer,
		}: {
			size: BigNumberish
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSell(poolAddress, {
				size,
				premiumLimit,
				referrer,
			}),
			'encodeSell'
		)
	}

	/**
	 * Encodes the fill quote request, preparing the transaction for execution.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {Object} options - The options for the fill quote request.
	 * @param {Quote} options.quote - The quote object.
	 * @param {BigNumberish} options.size - The size to fill.
	 * @param {Signature} options.signature - The signature of the quote provider.
	 * @param {string} [options.referrer] - The address of the referrer.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to the encoded fill quote request.
	 */
	async encodeFillQuote(
		poolAddress: string,
		{
			quote,
			size,
			signature,
			referrer,
		}: {
			quote: Quote
			size: BigNumberish
			signature: Signature
			referrer?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.fillQuoteOB.populateTransaction(
			quote,
			size,
			signature,
			this.toReferrer(referrer)
		)
	}

	/**
	 * Sends a fill quote request.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {Object} options - The options for the fill quote request.
	 * @param {Quote} options.quote - The quote object.
	 * @param {BigNumberish} options.size - The size to fill.
	 * @param {Signature} options.signature - The signature of the quote provider.
	 * @param {string} [options.referrer] - The address of the referrer.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to the transaction response.
	 */
	async fillQuote(
		poolAddress: string,
		options: {
			quote: Quote
			size: BigNumberish
			signature: Signature
			referrer?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeFillQuote(poolAddress, options),
			'encodeFillQuote'
		)
	}

	/**
	 * Retrieves the filled amount of a quote.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string} quoteProvider - The address of the quote provider.
	 * @param {string} quoteHash - The hash of the quote.
	 * @returns {Promise<bigint>} A promise that resolves to the filled amount of the quote.
	 */
	async getFilledQuoteAmount(
		poolAddress: string,
		quoteProvider: string,
		quoteHash: string
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.getQuoteOBFilledAmount(quoteProvider, quoteHash)
	}

	/**
	 * Encodes the cancel quote request, preparing the transaction for execution.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string} quoteHash - The hash of the quote to be cancelled.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to the encoded cancel quote request.
	 */
	async encodeCancelQuote(
		poolAddress: string,
		quoteHash: string
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.cancelQuotesOB.populateTransaction([quoteHash])
	}

	/**
	 * Sends a cancel quote request.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string} quoteHash - The hash of the quote to be cancelled.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to the transaction response.
	 */
	async cancelQuote(
		poolAddress: string,
		quoteHash: string
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeCancelQuote(poolAddress, quoteHash),
			'encodeCancelQuote'
		)
	}

	/**
	 * Encodes the cancel quotes request for multiple quotes, preparing the transaction for execution.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string[]} quoteHashes - An array of hashes of the quotes to be cancelled.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to the encoded cancel quotes request.
	 */
	async encodeCancelQuotes(
		poolAddress: string,
		quoteHashes: string[]
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.cancelQuotesOB.populateTransaction(quoteHashes)
	}

	/**
	 * Cancels multiple quotes.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string[]} quoteHashes - An array of hashes of the quotes to be cancelled.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to the transaction response.
	 */
	async cancelQuotes(
		poolAddress: string,
		quoteHashes: string[]
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeCancelQuotes(poolAddress, quoteHashes),
			'encodeCancelQuotes'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to exercise long option positions. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} The address of the pool.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to the transaction response.
	 */
	async encodeExercise(poolAddress: string): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.exercise.populateTransaction()
	}

	/**
	 * Returns a promise containing a signed transaction to exercise long option positions.
	 * @param poolAddress {string} Contract address of the pool.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async exercise(poolAddress: string): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeExercise(poolAddress),
			'encodeExercise'
		)
	}

	/**
	 * Previews the result of exercising the options in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<[bigint, bigint]>} The result of exercising the options.
	 */
	async previewExercise(poolAddress: string): Promise<
		[bigint, bigint] & {
			exerciseValue: bigint
			exerciseFee: bigint
		}
	> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.exercise.staticCall()
	}

	/**
	 * Returns a promise containing a populated transaction to settle short option positions. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettle(poolAddress: string): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settle.populateTransaction()
	}

	/**
	 * Returns a promise containing a signed transaction to settle short option positions.
	 * @param poolAddress {string} Contract address of the pool.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async settle(poolAddress: string): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSettle(poolAddress),
			'encodeSettle'
		)
	}

	/**
	 * Previews the result of settling the options in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {Promise<bigint>} The result of settling the options.
	 */
	async previewSettle(poolAddress: string): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settle.staticCall()
	}

	/**
	 * Returns a promise containing a populated transaction to settle a range order position. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettlePosition(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}
		return this.encodeSettlePositionWithKey(poolAddress, positionKey)
	}

	/**
	 * Returns a promise containing a signed transaction to settle a range order position.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async settlePosition(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSettlePosition(poolAddress, {
				owner,
				lower,
				upper,
				orderType,
				operator,
			}),
			'encodeSettlePosition'
		)
	}

	/**
	 * Previews the result of settling a specific position in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {Object} positionData - Data defining the position to settle.
	 * @param {string} positionData.owner - The address of the position owner.
	 * @param {BigNumberish} positionData.lower - The lower bound of the position.
	 * @param {BigNumberish} positionData.upper - The upper bound of the position.
	 * @param {OrderType} positionData.orderType - The order type of the position.
	 * @param {string} [positionData.operator] - The address of the operator.
	 * @returns {Promise<bigint>} The result of settling the position.
	 */
	async previewSettlePosition(
		poolAddress: string,
		{
			owner,
			lower,
			upper,
			orderType,
			operator,
		}: {
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
		}
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner: owner,
			orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}

		return poolContract.settlePosition.staticCall(positionKey)
	}

	/**
	 * Returns a promise containing a populated transaction to settle a range order position. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettlePositionWithKey(
		poolAddress: string,
		positionKey: PositionKey
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settlePosition.populateTransaction(positionKey)
	}

	/**
	 * Returns a promise containing a signed transaction to settle a range order position.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKey {PositionKey} PositionKey parametrizing the range order.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async settlePositionWithKey(
		poolAddress: string,
		positionKey: PositionKey
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSettlePositionWithKey(poolAddress, positionKey),
			'encodeSettlePositionWithKey'
		)
	}

	/**
	 * Previews the result of settling a specific position in the specified pool using a position key.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {PositionKey} positionKey - The key identifying the position.
	 * @returns {Promise<bigint>} The result of settling the position.
	 */
	async previewSettlePositionWithKey(
		poolAddress: string,
		positionKey: PositionKey
	): Promise<bigint> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settlePosition.staticCall(positionKey)
	}

	/**
	 * Returns a promise containing a populated transaction to exercise option positions on behalf of other users. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param holderAddresses {string[]} Addresses of which the long option positions should be exercised. Note a user can only exercise long option positions on behalf of other users if the holder granted permission via the UserSettings.
	 * @param costPerHolder {BigNumberish} Amount charged for exercising the long options per holder. Note the maximum amount charged is specified by each option holder individually in the UserSettings. If the amount charged is above the exercise value the transaction will revert.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeExerciseFor(
		poolAddress: string,
		holderAddresses: string[],
		costPerHolder: BigNumberish
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.exerciseFor.populateTransaction(
			holderAddresses,
			costPerHolder
		)
	}

	/**
	 * Returns a promise containing a signed transaction to exercise option positions on behalf of other users. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param holderAddresses {string[]} Addresses of which the long option positions should be exercised. Note a user can only exercise long option positions on behalf of other users if the holder granted permission via the UserSettings.
	 * @param costPerHolder {BigNumberish} Amount charged for exercising the long options per holder. Note the maximum amount charged is specified by each option holder individually in the UserSettings. If the amount charged is above the exercise value the transaction will revert.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async exerciseFor(
		poolAddress: string,
		holderAddresses: string[],
		costPerHolder: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeExerciseFor(poolAddress, holderAddresses, costPerHolder),
			'encodeExerciseFor'
		)
	}

	/**
	 * Previews the result of exercising the options for a list of holders in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string[]} holderAddresses - The array of holder addresses.
	 * @param {BigNumberish} costPerHolder - The cost per holder.
	 * @returns {Promise<[bigint[], bigint[]]>} The result of exercising the options for the holders.
	 */
	async previewExerciseFor(
		poolAddress: string,
		holderAddresses: string[],
		costPerHolder: BigNumberish
	): Promise<
		[bigint[], bigint[]] & {
			exerciseValues: bigint[]
			exerciseFees: bigint[]
		}
	> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.exerciseFor.staticCall(holderAddresses, costPerHolder)
	}

	/**
	 * Returns a promise containing a populated transaction to settle option positions on behalf of other users. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param underwriterAddresses {string[]} List containing the addresses for which the short options should be settled. Note a user can only settle short option positions on behalf of other users if the holder granted permission via the UserSettings.
	 * @param costPerUnderwriter {BigNumberish} Amount charged by the user to each underwriter. Note the maximum amount charged is specified by each underwriter individually in the UserSettings. If the amount charged is above the settlement value the transaction will revert. // todo
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettleFor(
		poolAddress: string,
		underwriterAddresses: string[],
		costPerUnderwriter: BigNumberish
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settleFor.populateTransaction(
			underwriterAddresses,
			costPerUnderwriter
		)
	}

	/**
	 * Returns a promise containing a signed transaction to settle option positions on behalf of other users.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param underwriterAddresses {string[]} List containing the addresses for which the short options should be settled. Note a user can only settle short option positions on behalf of other users if the holder granted permission via the UserSettings.
	 * @param costPerUnderwriter {BigNumberish} Amount charged by the user to each underwriter. Note the maximum amount charged is specified by each underwriter individually in the UserSettings. If the amount charged is above the settlement value the transaction will revert. // todo
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async settleFor(
		poolAddress: string,
		underwriterAddresses: string[],
		costPerUnderwriter: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSettleFor(
				poolAddress,
				underwriterAddresses,
				costPerUnderwriter
			),
			'encodeSettleFor'
		)
	}

	/**
	 * Previews the result of settling the options for a list of underwriters in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {string[]} underwriterAddresses - The array of underwriter addresses.
	 * @param {BigNumberish} costPerUnderwriter - The cost per underwriter.
	 * @returns {Promise<bigint[]>} The result of settling the options for the underwriters.
	 */
	async previewSettleFor(
		poolAddress: string,
		underwriterAddresses: string[],
		costPerUnderwriter: BigNumberish
	): Promise<bigint[]> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settleFor.staticCall(
			underwriterAddresses,
			costPerUnderwriter
		)
	}

	/**
	 * Returns a promise containing a populated transaction to settle range orders / positions on behalf of other users. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKeys {string[]} List containing the position keys parametrizing the range orders that should be settled. Note a user can only settle range order positions on behalf of other users if the liquidity providers granted permission via the UserSettings.
	 * @param costPerHolder {BigNumberish} Amount charged by the user to each liquidity provider. Note the maximum amount charged is specified by each liquidity provider individually in the UserSettings. If the amount charged is above the settlement value of the range order the transaction will revert. // todo
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettlePositionFor(
		poolAddress: string,
		positionKeys: PositionKey[],
		costPerHolder: BigNumberish
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settlePositionFor.populateTransaction(
			positionKeys,
			costPerHolder
		)
	}

	/**
	 * Returns a promise containing a signed transaction to settle option positions on behalf of other users.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param positionKeys {string[]} List containing the position keys parametrizing the range orders that should be settled. Note a user can only exercise long option positions on behalf of other users if the holder granted permission via the UserSettings.
	 * @param costPerHolder {BigNumberish} Amount charged by the user to each liquidity provider. Note the maximum amount charged is specified by each liquidity provider individually in the UserSettings. If the amount charged is above the settlement value of the range order the transaction will revert. // todo
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async settlePositionFor(
		poolAddress: string,
		positionKeys: PositionKey[],
		costPerHolder: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeSettlePositionFor(poolAddress, positionKeys, costPerHolder),
			'encodeSettlePositionFor'
		)
	}

	/**
	 * Previews the result of settling the positions for a list of holders in the specified pool.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {PositionKey[]} positionKeys - The array of position keys.
	 * @param {BigNumberish} costPerHolder - The cost per holder.
	 * @returns {Promise<bigint[]>} The result of settling the positions for the holders.
	 */
	async previewSettlePositionFor(
		poolAddress: string,
		positionKeys: PositionKey[],
		costPerHolder: BigNumberish
	): Promise<bigint[]> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.settlePositionFor.staticCall(
			positionKeys,
			costPerHolder
		)
	}

	/**
	 * Returns a promise containing a populated transaction to transfer range order liquidity to another owner and operator. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} Amount of liquidity transferred. Liquidity is denominated in option contracts that can be sold or (potentially) bought.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param toOwner {string} Address of the owner receiving the range order liquidity.
	 * @param toOperator {string} Address of the owner receiving the range order liquidity.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeTransferPosition(
		poolAddress: string,
		{
			size,
			owner,
			lower,
			upper,
			orderType,
			operator,
			toOwner,
			toOperator,
		}: {
			size: BigNumberish
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
			toOwner: string
			toOperator?: string
		}
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		const poolSettings = await poolContract.getPoolSettings()

		const positionKey: PositionKey = {
			lower: toBigInt(lower),
			upper: toBigInt(upper),
			operator: operator || owner,
			owner,
			orderType: orderType,
			isCall: poolSettings.isCallPool,
			strike: poolSettings.strike,
		}

		return poolContract.transferPosition.populateTransaction(
			positionKey,
			toOwner,
			toOperator || toOwner,
			size
		)
	}

	/**
	 * Returns a promise containing a signed transaction to transfer range order liquidity to another owner and operator.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} Amount of liquidity transferred. Liquidity is denominated in option contracts that can be sold or (potentially) bought.
	 * @param owner {string} Address of the owner.
	 * @param lower {BigNumberish} Lower tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param upper {BigNumberish} Upper tick price of the range order. Tick price is quoted in the base for calls and in the quote for puts where it is additionally normalized by the strike.
	 * @param orderType {OrderType} Type of the range order (LC or CS).
	 * @param operator {string} Address of the operator.
	 * @param toOwner {string} Address of the owner receiving the range order liquidity.
	 * @param toOperator {string} Address of the owner receiving the range order liquidity.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async transferPosition(
		poolAddress: string,
		{
			size,
			owner,
			lower,
			upper,
			orderType,
			operator,
			toOwner,
			toOperator,
		}: {
			size: BigNumberish
			owner: string
			lower: BigNumberish
			upper: BigNumberish
			orderType: OrderType
			operator?: string
			toOwner: string
			toOperator?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeTransferPosition(poolAddress, {
				size,
				owner,
				lower,
				upper,
				orderType,
				operator,
				toOwner,
				toOperator,
			}),
			'encodeTransferPosition'
		)
	}

	/**
	 * Returns a promise containing a populated transaction to transfer range order liquidity to another owner and operator. Allows the user to use the SDK without providing a signer.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} Amount of liquidity transferred. Liquidity is denominated in option contracts that can be sold or (potentially) bought.
	 * @param positionKey {PositionKey} Position key parametrizing the range order that should be transferred.
	 * @param toOwner {string} Address of the owner receiving the range order liquidity.
	 * @param toOperator {string} Address of the owner receiving the range order liquidity.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeTransferPositionWithKey(
		poolAddress: string,
		size: BigNumberish,
		positionKey: PositionKey,
		toOwner: string,
		toOperator?: string
	): Promise<ContractTransaction> {
		const poolContract = this.premia.contracts.getPoolContract(poolAddress)
		return poolContract.transferPosition.populateTransaction(
			positionKey,
			toOwner,
			toOperator || toOwner,
			size
		)
	}

	/**
	 * Returns a promise containing a signed transaction to transfer range order liquidity to another owner and operator.
	 * @param poolAddress {string} Contract address of the pool.
	 * @param size {BigNumberish} Amount of liquidity transferred. Liquidity is denominated in option contracts that can be sold or (potentially) bought.
	 * @param positionKey {PositionKey} Position key parametrizing the range order that should be transferred.
	 * @param toOwner {string} Address of the owner receiving the range order liquidity.
	 * @param toOperator {string} Address of the owner receiving the range order liquidity.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async transferPositionWithKey(
		poolAddress: string,
		size: BigNumberish,
		positionKey: PositionKey,
		toOwner: string,
		toOperator?: string
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getPoolContract(poolAddress),
			this.encodeTransferPositionWithKey(
				poolAddress,
				size,
				positionKey,
				toOwner,
				toOperator
			),
			'encodeTransferPositionWithKey'
		)
	}
}
