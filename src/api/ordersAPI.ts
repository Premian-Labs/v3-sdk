import {
	AbiCoder,
	BigNumberish,
	keccak256,
	Provider,
	Signature,
	solidityPacked,
	toBigInt,
	toUtf8Bytes,
	TransactionReceipt,
	ZeroAddress,
} from 'ethers'
import { isEqual } from 'lodash'

import { BaseAPI } from './baseAPI'
import { convertDecimals, signData } from '../utils'
import { Addresses, WAD_BI, WAD_DECIMALS } from '../constants'
import {
	EIP712Domain,
	FillableQuote,
	QuoteSaltOptionalT,
	QuoteT,
	QuoteWithSignature,
	QuoteWithSignatureT,
	OrderbookQuote,
	SerializedQuote,
	SignatureDomain,
	PoolMinimal,
	PoolKey,
} from '../entities'

/**
 * Represents a class for handling Orderbook (OB) related operations.
 *
 * @class OrdersAPI
 * @extends {BaseAPI}
 */
export class OrdersAPI extends BaseAPI {
	/**
	 * Selects the best quote from a list of quotes based on a pricing strategy.
	 *
	 * @private
	 * @param {OrderbookQuote[]} quotes - An array of quotes.
	 * @param {BigNumberish} size - The size of the trade.
	 * @param {BigNumberish} [minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [taker] - The address of the taker (optional).
	 * @param {Provider} [provider] - The custom provider to use for this call.
	 * @returns {Promise<OrderbookQuote[] | null>} - A promise resolving to the best quote from the array of quotes, or null if no valid quote is found.
	 */
	private async bestQuote(
		quotes: OrderbookQuote[],
		size: BigNumberish,
		minimumSize?: BigNumberish,
		taker?: string,
		provider?: Provider
	): Promise<OrderbookQuote | null> {
		const bestQuotes = quotes.slice().sort((a, b) => {
			const betterQuote = this.premia.pricing.better(
				{
					...a,
					size: a.fillableSize,
				},
				{
					...b,
					size: b.fillableSize,
				},
				size,
				minimumSize
			) as QuoteWithSignatureT
			return betterQuote === a ? -1 : 1
		})

		/// @dev: return the first valid quote in order of sorting
		for (const quote of bestQuotes) {
			try {
				if (
					await this.isQuoteValid(
						quote,
						quote.fillableSize,
						taker,
						true,
						provider
					)
				) {
					return quote
				} else {
					console.log('Invalid quote: ', quote)
				}
			} catch (err) {
				console.error('Quote validation error: ', err)
			}
		}

		return null
	}

	/**
	 * Converts a quote into a fillable quote, with additional properties required for execution.
	 *
	 * @private
	 * @param {string} poolAddress - The address of the pool.
	 * @param {BigNumberish} size - The size of the trade.
	 * @param {OrderbookQuote} quote - The orderbook quote to be converted.
	 * @param {number} [createdAt] - The timestamp of the quote's creation (optional).
	 * @param {string} [referrer] - The address of the referrer (optional).
	 * @param {Provider} [provider] - The custom provider to use for this call.
	 * @returns {Promise<FillableQuote>} - A promise resolving to the fillable quote.
	 */
	private async tradeQuoteToFillable(
		poolAddress: string,
		size: BigNumberish,
		quote: OrderbookQuote,
		createdAt?: number,
		referrer?: string,
		provider?: Provider,
		pool?: PoolMinimal
	): Promise<FillableQuote> {
		const poolContract = this.premia.contracts.getPoolContract(
			poolAddress,
			provider ?? this.premia.multicallProvider
		)
		const price = toBigInt(quote.price)
		const _size =
			toBigInt(size) > toBigInt(quote.fillableSize)
				? toBigInt(quote.fillableSize)
				: toBigInt(size)
		const normalizedPremium = (_size * price) / WAD_BI

		const [_pool, takerFee] = await Promise.all([
			pool ?? this.premia.pools.getPoolMinimal(poolAddress),
			this.premia.pools.takerFee(
				poolAddress,
				_size,
				normalizedPremium,
				true,
				true,
				quote.taker,
				provider
			),
		])

		const denormalizedPrice = _pool.isCall
			? price
			: (price * toBigInt(_pool.strike)) / WAD_BI
		const convertedPrice = convertDecimals(
			denormalizedPrice,
			WAD_DECIMALS,
			_pool.collateralAsset.decimals
		)

		const premium = convertDecimals(
			(_size * denormalizedPrice) / WAD_BI,
			WAD_DECIMALS,
			_pool.collateralAsset.decimals
		)

		const approvalAmount = quote.isBuy
			? _size - premium + takerFee
			: premium + takerFee

		return {
			...quote,
			createdAt,
			pool: _pool,
			deadline: toBigInt(quote.deadline),
			price: convertedPrice,
			salt: toBigInt(quote.salt),
			size: _size,
			takerFee,
			approvalTarget: Addresses[this.premia.chainId].ERC20_ROUTER,
			approvalAmount,
			to: poolAddress,
			data: poolContract.interface.encodeFunctionData('fillQuoteOB', [
				{
					provider: quote.provider,
					taker: quote.taker,
					price: quote.price,
					size: quote.size,
					isBuy: quote.isBuy,
					deadline: quote.deadline,
					salt: quote.salt,
				},
				_size,
				Signature.from(quote.signature),
				this.premia.pools.toReferrer(referrer),
			]),
		}
	}

	/**
	 * Checks whether a quote is valid. Can optionally throw an error if the quote is invalid.
	 *
	 * @param {OrderbookQuote} quote - The quote to check.
	 * @param {BigNumberish} [size] - The size of the trade (optional).
	 * @param {string} [taker] - The address of the taker (optional).
	 * @param {boolean} [throwError=false] - Whether to throw an error if the quote is invalid (default is false).
	 * @param {Provider} [provider] - The custom provider to use for this call (optional).
	 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the quote is valid.
	 */
	async isQuoteValid(
		quote: OrderbookQuote,
		size?: BigNumberish,
		taker?: string,
		throwError: boolean = false,
		provider?: Provider
	): Promise<boolean> {
		/// @TODO: this currently will fail if a pool is not deployed. need to replace with
		///        off-chain checks for allowance and balance

		const { isValid, error } = await this.premia.pools.isQuoteValid(
			quote,
			{
				taker,
				size,
			},
			provider
		)

		if (!isValid && throwError) {
			throw new Error(error)
		}

		return isValid
	}

	/**
	 * Fetches the best quote for a specified pool address and trade size.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {BigNumberish} size - The size of the trade.
	 * @param {boolean} isBuy - Whether it's a buy or a sell.
	 * @param {BigNumberish} [minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [referrer] - The address of the referrer (optional).
	 * @param {string} [taker] - The address of the taker (optional).
	 * @param {Provider} [provider] - The custom provider to use for this call (optional).
	 * @param {PoolKey} [poolKey] - The pool key to stream quotes from, passed for optimization purposes (optional).
	 * @param {PoolMinimal} [pool] - The pool to stream quotes from, passed for optimization purposes (optional).
	 * @returns {Promise<FillableQuote | null>} - The best fillable quote, or null if no quotes available.
	 */
	async quote(
		poolAddress: string,
		size: BigNumberish,
		isBuy: boolean,
		minimumSize?: BigNumberish,
		referrer?: string,
		taker?: string,
		provider?: Provider,
		pool?: PoolMinimal
	): Promise<FillableQuote | null> {
		let quotes = await this.premia.orderbook.getQuotes(
			poolAddress,
			size.toString(),
			isBuy ? 'ask' : 'bid',
			undefined,
			taker
		)
		if (quotes.length === 0) {
			return null
		}

		const bestQuote = await this.bestQuote(
			quotes,
			size,
			minimumSize,
			taker,
			provider
		)

		if (bestQuote === null) {
			return null
		}

		return this.tradeQuoteToFillable(
			poolAddress,
			size,
			bestQuote,
			bestQuote.ts,
			referrer,
			provider,
			pool
		)
	}

	/**
	 * Streams quotes for the given options and executes a callback for the best quote.
	 *
	 * @param {object} options - The options for the quotes stream:
	 * @param {string} options.poolAddress - The address of the pool.
	 * @param {BigNumberish} options.size - The size of the trade.
	 * @param {boolean} options.isBuy - Whether it's a buy or a sell.
	 * @param {BigNumberish} [options.minimumSize] - The minimum size of the trade (optional).
	 * @param {string} [options.referrer] - The address of the referrer (optional).
	 * @param {string} [options.taker] - The address of the taker (optional).
	 * @param {Provider} [options.provider] - The custom provider to use for this call (optional).
	 * @param {boolean} [options.forceSendRFQ] - Whether to force sending/listening for Request-for-Quotes (optional).
	 * @param {PoolKey} [options.poolKey] - The pool key to stream quotes from, passed for optimization purposes (optional).
	 * @param {PoolMinimal} [options.pool] - The pool to stream quotes from, passed for optimization purposes (optional).
	 * @param {(quote: FillableQuote | null) => void} callback - The callback to execute for the best quote.
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
			provider?: Provider
			forceSendRFQ?: boolean
			poolKey?: PoolKey
			pool?: PoolMinimal
		},
		callback: (quote: FillableQuote | null) => void
	): Promise<void> {
		let bestQuote: FillableQuote | null = null
		const index = this.streamIndex

		const callbackIfNotStale = (quote: FillableQuote | null) => {
			if (this.streamIndex > index) return
			callback(quote)
		}

		try {
			const poolKey =
				options.poolKey ??
				(await this.premia.pools.getPoolKeyFromAddress(
					options.poolAddress,
					options.provider
				))

			let [, bestQuote] = await Promise.all([
				options.taker || options.forceSendRFQ
					? this.premia.orderbook.publishRFQ({
							poolKey,
							side: options.isBuy ? 'bid' : 'ask',
							chainId: this.premia.chainId.toString(),
							size: options.size.toString(),
							taker: options.taker ?? ZeroAddress,
					  })
					: Promise.resolve(),
				this.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.minimumSize,
					options.referrer,
					options.taker,
					options.provider,
					options.pool
				),
			])

			callbackIfNotStale(bestQuote)
		} catch (error) {
			console.error('Error streaming OB quote: ', error)
			callbackIfNotStale(null)
		}

		if (!options.taker && !options.forceSendRFQ) return

		await this.premia.orderbook.subscribe(
			{
				type: 'FILTER',
				channel: 'QUOTES',
				body: {
					poolAddress: options.poolAddress,
					side: options.isBuy ? 'ask' : 'bid',
					chainId: this.premia.chainId.toString(),
				},
			},
			async (message) => {
				if (message.type == 'POST_QUOTE') {
					const quote = await this.bestQuote(
						[message.body],
						options.size,
						options.minimumSize,
						options.taker,
						options.provider
					)
					if (quote === null) return

					if (bestQuote === null) {
						bestQuote = await this.tradeQuoteToFillable(
							options.poolAddress,
							options.size,
							quote,
							quote.ts,
							options.referrer,
							options.provider
						)
						callbackIfNotStale(bestQuote)
					} else {
						const better = this.premia.pricing.better(
							quote,
							bestQuote,
							options.size,
							options.minimumSize
						)

						if (isEqual(better, quote)) {
							bestQuote = await this.tradeQuoteToFillable(
								options.poolAddress,
								options.size,
								quote,
								quote.ts,
								options.referrer,
								options.provider
							)
							callbackIfNotStale(bestQuote)
						}
					}
				}
			}
		)
	}

	/**
	 * Cancels the quotes stream for orderbook quotes.
	 *
	 * @returns {Promise<void>}
	 */
	cancelQuoteStream() {
		this.premia.orderbook.unsubscribe('QUOTES')
	}

	/**
	 * Cancels all active quotes streams.
	 *
	 * @returns {Promise<void>}
	 */
	async cancelAllStreams() {
		this.streamIndex += 1

		this.premia.orderbook.unsubscribe('QUOTES')
		this.premia.orderbook.unsubscribe('RFQ')
	}

	/**
	 * Publishes a quote using an API key.
	 *
	 * @param {QuoteWithSignatureT} quote - The quote to publish.
	 * @returns {Promise<OrderbookQuote[]>} - A promise that resolves to the published quote.
	 */
	async publishQuoteWithApiKey(
		quote: QuoteWithSignatureT
	): Promise<OrderbookQuote[]> {
		return this.publishQuotesWithApiKey([quote])
	}

	/**
	 * Publishes a list of quotes with an API key.
	 *
	 * @param {QuoteWithSignatureT[]} quotes - The list of quotes to publish.
	 * @returns {Promise<OrderbookQuote[]>} A promise that resolves to the list of returned OB quotes.
	 */
	async publishQuotesWithApiKey(
		quotes: QuoteWithSignatureT[]
	): Promise<OrderbookQuote[]> {
		return this.premia.orderbook
			.publishQuotes(quotes)
			.then((res) => res.created)
	}

	/**
	 * Publishes an unsigned quote with an API key.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {QuoteSaltOptionalT} quote - The unsigned quote to publish.
	 * @returns {Promise<OrderbookQuote[]>} A promise that resolves to the list of returned OB quotes.
	 */
	async publishUnsignedQuoteWithApiKey(
		poolAddress: string,
		quote: QuoteSaltOptionalT
	): Promise<OrderbookQuote[]> {
		return this.publishUnsignedQuotesWithApiKey(poolAddress, [quote])
	}

	/**
	 * Publishes a list of unsigned quotes with an API key.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {QuoteSaltOptionalT[]} quotes - The list of unsigned quotes to publish.
	 * @returns {Promise<OrderbookQuote[]>} A promise that resolves to the list of returned OB quotes.
	 */
	async publishUnsignedQuotesWithApiKey(
		poolAddress: string,
		quotes: QuoteSaltOptionalT[]
	): Promise<OrderbookQuote[]> {
		const _quotes = await Promise.all(
			quotes.map((quote) => this.signQuote(poolAddress, quote))
		)
		return this.premia.orderbook
			.publishQuotes(_quotes)
			.then((res) => res.created)
	}

	/**
	 * Publishes an unsigned quote.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {QuoteSaltOptionalT} quote - The unsigned quote to publish.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<TransactionReceipt | null>} A promise that resolves to the transaction receipt or null if failed.
	 */
	async publishUnsignedQuote(
		poolAddress: string,
		quote: QuoteSaltOptionalT,
		provider?: Provider
	): Promise<TransactionReceipt | null> {
		return this.publishUnsignedQuotes(poolAddress, [quote], provider)
	}

	/**
	 * Publishes a list of unsigned quotes.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {QuoteSaltOptionalT[]} quotes - The list of unsigned quotes to publish.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<TransactionReceipt | null>} A promise that resolves to the transaction receipt or null if failed.
	 */
	async publishUnsignedQuotes(
		poolAddress: string,
		quotes: QuoteSaltOptionalT[],
		provider?: Provider
	): Promise<TransactionReceipt | null> {
		const _quotes = await Promise.all(
			quotes.map((quote) => this.signQuote(poolAddress, quote))
		)
		return this.publishQuotes(_quotes, provider)
	}

	/**
	 * Publishes a quote.
	 *
	 * @param {QuoteWithSignatureT} quote - The quote to publish.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<TransactionReceipt | null>} A promise that resolves to the transaction receipt or null if failed.
	 */
	async publishQuote(
		quote: QuoteWithSignatureT,
		provider?: Provider
	): Promise<TransactionReceipt | null> {
		return this.publishQuotes([quote], provider)
	}

	/**
	 * Publishes a list of quotes.
	 *
	 * @param {QuoteWithSignatureT[]} quotes - The list of quotes to publish.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<TransactionReceipt | null>} A promise that resolves to the transaction receipt or null if failed.
	 */
	async publishQuotes(
		quotes: QuoteWithSignatureT[],
		provider?: Provider
	): Promise<TransactionReceipt | null> {
		const orderbook = this.premia.contracts.getOrderbookContract(provider)
		const _quotes = this.premia.orderbook.serializeQuotesWithSignature(quotes)
		const response = await orderbook.add(_quotes)
		return response.wait()
	}

	/**
	 * Signs a quote.
	 *
	 * @param {string} poolAddress - The address of the pool.
	 * @param {QuoteSaltOptionalT} quote - The quote to be signed.
	 * @returns {Promise<QuoteWithSignature>} A promise that resolves to the signed quote.
	 */
	async signQuote(
		poolAddress: string,
		quote: QuoteSaltOptionalT
	): Promise<QuoteWithSignature> {
		const domain: SignatureDomain = {
			name: 'Premia',
			version: '1',
			chainId: this.premia.chainId,
			verifyingContract: poolAddress,
		}

		if (quote.salt === undefined) {
			quote.salt = toBigInt(new Date().getTime())
		} else {
			quote.salt = toBigInt(quote.salt)
		}

		const message: Omit<SerializedQuote, 'poolKey'> = {
			provider: quote.provider,
			taker: quote.taker,
			price: quote.price.toString(),
			size: quote.size.toString(),
			isBuy: quote.isBuy,
			deadline: Number(quote.deadline),
			salt: Number(quote.salt),
		}

		const typedData = {
			types: {
				EIP712Domain,
				FillQuoteOB: [
					{ name: 'provider', type: 'address' },
					{ name: 'taker', type: 'address' },
					{ name: 'price', type: 'uint256' },
					{ name: 'size', type: 'uint256' },
					{ name: 'isBuy', type: 'bool' },
					{ name: 'deadline', type: 'uint256' },
					{ name: 'salt', type: 'uint256' },
				],
			},
			primaryType: 'FillQuoteOB',
			domain,
			message,
		}

		const rsv = await signData(this.premia.signer, quote.provider, typedData)

		return {
			poolKey: quote.poolKey,
			provider: quote.provider,
			taker: quote.taker,
			price: toBigInt(quote.price),
			size: toBigInt(quote.size),
			isBuy: quote.isBuy,
			deadline: toBigInt(quote.deadline),
			salt: toBigInt(quote.salt),
			signature: rsv,
			chainId: String(this.premia.chainId),
		}
	}

	/**
	 * Calculates the hash of a quote. This is a static method.
	 *
	 * @param {QuoteT} quote - The quote to hash.
	 * @param {string} poolAddress - The address of the pool.
	 * @param {number} chainId - The id of the chain.
	 * @returns {string} The calculated hash of the quote.
	 */
	static calculateQuoteHash(
		quote: QuoteT,
		poolAddress: string,
		chainId: number
	) {
		const FILL_QUOTE_TYPE_HASH = keccak256(
			toUtf8Bytes(
				'FillQuoteOB(address provider,address taker,uint256 price,uint256 size,bool isBuy,uint256 deadline,uint256 salt)'
			)
		)

		const EIP712_TYPE_HASH = keccak256(
			toUtf8Bytes(
				'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
			)
		)

		const domain: SignatureDomain = {
			name: 'Premia',
			version: '1',
			chainId: chainId,
			verifyingContract: poolAddress,
		}

		const defaultAbiCoder = new AbiCoder()

		const domainHash = keccak256(
			defaultAbiCoder.encode(
				['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
				[
					EIP712_TYPE_HASH,
					keccak256(toUtf8Bytes(domain.name)),
					keccak256(toUtf8Bytes(domain.version)),
					domain.chainId,
					domain.verifyingContract,
				]
			)
		)

		const structHash = keccak256(
			defaultAbiCoder.encode(
				[
					'bytes32',
					'address',
					'address',
					'uint256',
					'uint256',
					'bool',
					'uint256',
					'uint256',
				],
				[
					FILL_QUOTE_TYPE_HASH,
					quote.provider,
					quote.taker,
					quote.price,
					quote.size,
					quote.isBuy,
					quote.deadline,
					quote.salt,
				]
			)
		)

		return keccak256(
			solidityPacked(
				['string', 'bytes32', 'bytes32'],
				['\x19\x01', domainHash, structHash]
			)
		)
	}

	/**
	 * Calculates the hash of a quote.
	 *
	 * @method calculateQuoteHash
	 * @param {QuoteT} quote - The quote to hash.
	 * @param {string} poolAddress - The address of the pool.
	 * @returns {string} The calculated hash of the quote.
	 */
	calculateQuoteHash(quote: QuoteT, poolAddress: string) {
		const FILL_QUOTE_TYPE_HASH = keccak256(
			toUtf8Bytes(
				'FillQuoteOB(address provider,address taker,uint256 price,uint256 size,bool isBuy,uint256 deadline,uint256 salt)'
			)
		)

		const EIP712_TYPE_HASH = keccak256(
			toUtf8Bytes(
				'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
			)
		)

		const domain: SignatureDomain = {
			name: 'Premia',
			version: '1',
			chainId: this.premia.chainId,
			verifyingContract: poolAddress,
		}

		const defaultAbiCoder = new AbiCoder()

		const domainHash = keccak256(
			defaultAbiCoder.encode(
				['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
				[
					EIP712_TYPE_HASH,
					keccak256(toUtf8Bytes(domain.name)),
					keccak256(toUtf8Bytes(domain.version)),
					domain.chainId,
					domain.verifyingContract,
				]
			)
		)

		const structHash = keccak256(
			defaultAbiCoder.encode(
				[
					'bytes32',
					'address',
					'address',
					'uint256',
					'uint256',
					'bool',
					'uint256',
					'uint256',
				],
				[
					FILL_QUOTE_TYPE_HASH,
					quote.provider,
					quote.taker,
					quote.price,
					quote.size,
					quote.isBuy,
					quote.deadline,
					quote.salt,
				]
			)
		)

		return keccak256(
			solidityPacked(
				['string', 'bytes32', 'bytes32'],
				['\x19\x01', domainHash, structHash]
			)
		)
	}
}
