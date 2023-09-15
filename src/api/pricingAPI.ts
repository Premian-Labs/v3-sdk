import { BigNumberish, FixedNumber, parseEther, toBigInt } from 'ethers'
import { emitWarning } from 'process'

import { FillableQuote, QuoteOrFillableQuoteT } from '../entities'
import { BaseAPI } from './baseAPI'

/**
 * Represents a class for handling pricing comparison operations.
 *
 * @class PricingAPI
 * @extends {BaseAPI}
 */
export class PricingAPI extends BaseAPI {
	/**
	 * Evaluates and returns the best quote from a set of quotes based on the provided size and other options.
	 *
	 * The function initially filters out null and undefined quotes. If all quotes are null or undefined,
	 * it returns null. If the pool keys of the quotes are not identical, it emits a warning unless
	 * `ignoreWarnings` is set to true.
	 *
	 * It then filters the quotes based on the minimum size and the deadline. Only RFQ quotes can be
	 * filtered by deadline. The size of the quote should be greater or equal to the minimum size provided.
	 *
	 * It finally compares all the quotes and returns the one deemed the best using the `better` method.
	 *
	 * @param {(QuoteOrFillableQuoteT | null)[]} quotes - Array of quotes or fillable quotes to be compared.
	 * @param {BigNumberish} size - The size to consider when comparing quotes.
	 * @param {BigNumberish} [minimumSize] - The minimum size to filter quotes by. If not provided, `size` will be used.
	 * @param {boolean} [ignoreWarnings=false] - Whether to ignore warnings if pool keys for quotes compared are not identical.
	 *
	 * @returns {QuoteOrFillableQuoteT | null} The best quote from the provided set, or null if no quotes pass the filtering conditions.
	 */
	best(
		quotes: (QuoteOrFillableQuoteT | null)[],
		size: BigNumberish,
		minimumSize?: BigNumberish,
		ignoreWarnings: boolean = false
	): QuoteOrFillableQuoteT | null {
		/// @dev filter out null and undefined quotes
		let filteredQuotes = quotes.filter((quote) => !!quote)
		if (filteredQuotes.length === 0) return null

		const now = Math.floor(new Date().getTime() / 1000)
		const poolKey = filteredQuotes[0]!.poolKey
		const _minSize = toBigInt(minimumSize ?? size)

		const samePoolKeys = filteredQuotes.every((x) => x!.poolKey === poolKey)
		if (!samePoolKeys && !ignoreWarnings) {
			if (emitWarning) {
				emitWarning('Pool keys for quotes compared are not identical')
			} else {
				console.warn('Pool keys for quotes compared are not identical')
			}
		}

		filteredQuotes = filteredQuotes.filter((quote) => {
			/// @dev only RFQ quotes can be filtered by deadline
			if (
				(quote as FillableQuote).createdAt &&
				Number(quote!.deadline) <= now
			) {
				return false
			}
			return toBigInt(quote!.size) >= _minSize
		})

		if (filteredQuotes.length === 0) return null

		return filteredQuotes.reduce(
			(best: QuoteOrFillableQuoteT | null, quote) => {
				if (!best) return quote
				if (!quote) return best
				return this.better(quote, best, size, minimumSize)
			},
			null
		)
	}

	/**
	 * Compares two quotes and returns the better one based on multiple factors.
	 *
	 * The function considers various factors including deadline, size, price, origin and timestamp (for RFQs)
	 * in determining which quote is better. If both quotes are essentially equivalent, quoteA is returned.
	 *
	 * @param {QuoteOrFillableQuoteT | null} quoteA - The first quote or fillable quote to be compared.
	 * @param {QuoteOrFillableQuoteT | null} quoteB - The second quote or fillable quote to be compared.
	 * @param {BigNumberish} size - The size to consider when comparing quotes.
	 * @param {BigNumberish} [minimumSize] - The minimum size to filter quotes by. If not provided, `size` will be used.
	 * @param {boolean} [ignoreWarnings=false] - Whether to ignore warnings if pool keys for quotes compared are not identical.
	 *
	 * @returns {QuoteOrFillableQuoteT | null} The better quote from the two provided, or null if neither quote passes the comparison conditions.
	 *
	 * @throws {Error} If minimum size is greater than size.
	 * @throws {Error} If quotes have opposite directions.
	 */
	better(
		quoteA: QuoteOrFillableQuoteT | null,
		quoteB: QuoteOrFillableQuoteT | null,
		size: BigNumberish,
		minimumSize?: BigNumberish,
		ignoreWarnings: boolean = false
	): QuoteOrFillableQuoteT | null {
		if (!quoteA) return quoteB
		if (!quoteB) return quoteA

		const now = Math.floor(new Date().getTime() / 1000)
		const _minimumSize = toBigInt(minimumSize ?? size)
		const quoteASize = toBigInt(quoteA.size)
		const quoteBSize = toBigInt(quoteB.size)

		if (minimumSize && minimumSize > size) {
			throw new Error('Minimum size cannot be greater than size')
		}

		if (quoteA.isBuy != quoteB.isBuy) {
			throw new Error('Cannot compare quotes with opposite direction')
		}

		if (quoteA.poolKey !== quoteB.poolKey && !ignoreWarnings) {
			if (emitWarning) {
				emitWarning('Pool keys for quotes compared are not identical')
			} else {
				console.warn('Pool keys for quotes compared are not identical')
			}
		}

		// 1) deadline filter (rfq vs rfq only)
		/// @dev these scenarios are not possible with best()
		if ((quoteA as FillableQuote).createdAt && quoteA.deadline <= now) {
			if (!(quoteB as FillableQuote).createdAt || quoteB.deadline > now) {
				return quoteBSize > _minimumSize ? quoteB : null
			}

			return null
		}

		if ((quoteB as FillableQuote).createdAt && quoteB.deadline <= now) {
			if (!(quoteA as FillableQuote).createdAt || quoteA.deadline > now) {
				return quoteASize > _minimumSize ? quoteA : null
			}

			return null
		}

		if (
			(quoteA as FillableQuote).createdAt &&
			(quoteA as FillableQuote).createdAt
		) {
			if (quoteA.deadline > now && quoteB.deadline <= now) {
				return quoteA
			} else if (quoteA.deadline <= now && quoteB.deadline > now) {
				return quoteB
			} else if (quoteA.deadline <= now && quoteB.deadline <= now) {
				return null
			}
		}

		// 2) min size threshold (uses size if minSize not provided)
		/// @dev not possible with best()
		if (quoteBSize < _minimumSize && quoteASize >= _minimumSize) {
			if (quoteA.deadline <= now) return null
			return quoteA
		} else if (quoteASize < _minimumSize && quoteBSize >= _minimumSize) {
			if (quoteB.deadline <= now) return null
			return quoteB
		} else if (quoteBSize < _minimumSize && quoteASize < _minimumSize) {
			return null
		}

		// 3) price priority
		if (quoteA.isBuy && quoteB.isBuy) {
			if (quoteA.price < quoteB.price) {
				return quoteA
			} else if (quoteA.price > quoteB.price) {
				return quoteB
			}
		} else {
			if (quoteA.price > quoteB.price) {
				return quoteA
			} else if (quoteA.price < quoteB.price) {
				return quoteB
			}
		}

		// 4) order origin priority: prefer pools and vaults over RFQ
		if (
			!(quoteA as FillableQuote).createdAt &&
			(quoteB as FillableQuote).createdAt
		) {
			return quoteA
		} else if (
			!(quoteB as FillableQuote).createdAt &&
			(quoteA as FillableQuote).createdAt
		) {
			return quoteB
		}

		// 5) if both quotes are RFQ, then use FIFO
		if (
			(quoteB as FillableQuote).createdAt &&
			(quoteA as FillableQuote).createdAt
		) {
			const quoteACreatedAt = (quoteA as FillableQuote).createdAt!
			const quoteBCreatedAt = (quoteB as FillableQuote).createdAt!
			return quoteBCreatedAt < quoteACreatedAt ? quoteB : quoteA
		}

		// quotes are essentially equivalent, return quoteA
		return quoteA
	}

	/**
	 * Calculates the limit of a premium based on maximum slippage percentage.
	 *
	 * The function computes the limit for a premium considering a given maximum slippage percentage.
	 * If the operation is a 'buy', the premium limit is increased by the slippage offset, otherwise,
	 * for a 'sell', the premium limit is decreased by the slippage offset.
	 *
	 * @param {BigNumberish} premium - The premium value used as the base for limit calculation.
	 * @param {Number} maxSlippagePercent - The maximum slippage percentage to calculate the offset.
	 * @param {boolean} isBuy - A flag indicating whether the operation is a 'buy' or 'sell'.
	 *
	 * @returns {bigint} The calculated limit for the premium considering the slippage.
	 */
	premiumLimit(
		premium: BigNumberish,
		maxSlippagePercent: Number,
		isBuy: boolean
	): bigint {
		const _premium = FixedNumber.fromValue(premium, 18)
		const _slippagePercent = FixedNumber.fromValue(
			parseEther(String(maxSlippagePercent)),
			18
		)
		const offset = _premium.mul(_slippagePercent)

		if (isBuy) {
			return _premium.add(offset).value
		} else {
			return _premium.sub(offset).value
		}
	}
}

export default PricingAPI
