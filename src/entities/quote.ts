import { BigNumberish, BytesLike } from 'ethers'

import { PoolKey, PoolMinimal } from './pool'
import { Signature } from './signature'

export type QuoteT = Quote | SerializedQuote
export type QuoteSaltOptionalT = QuoteSaltOptional | SerializedQuoteSaltOptional
export type QuoteWithSignatureT =
	| QuoteWithSignature
	| SerializedQuoteWithSignature
export type QuoteOrFillableQuoteT = QuoteWithSignatureT | FillableQuote

export interface Quote {
	poolKey: PoolKey
	provider: string
	taker: string
	price: bigint
	size: bigint
	isBuy: boolean
	deadline: bigint
	salt: bigint
}
export interface QuoteWithoutSalt extends Omit<Quote, 'salt'> {}
export interface QuoteOB extends Omit<Quote, 'poolKey'> {}
export interface QuoteOBMessage {
	provider: string
	taker: string
	price: string
	size: string
	isBuy: boolean
	deadline: string
	salt: string
}

export interface QuoteSaltOptional extends QuoteWithoutSalt {
	salt?: bigint
}
export interface QuoteWithSignature extends Quote {
	chainId: string
	signature: Signature
}

export interface OrderbookQuote extends SerializedQuote {
	chainId: string
	signature: Signature
	quoteId: string
	poolAddress: string
	fillableSize: string
	ts: number
}

export interface SerializedQuote {
	poolKey: PoolKey
	provider: string
	taker: string
	price: string
	size: string
	isBuy: boolean
	deadline: number
	salt: number
}
export interface SerializedQuoteWithoutSalt
	extends Omit<SerializedQuote, 'salt'> {}
export interface SerializedQuoteSaltOptional
	extends SerializedQuoteWithoutSalt {
	salt?: number
}
export interface SerializedQuoteWithSignature extends SerializedQuote {
	chainId: string
	signature: Signature
}

export interface SerializedIndexedQuote extends SerializedQuoteWithSignature {
	createdAt: number
}

export interface FillableQuote extends QuoteSaltOptional {
	createdAt?: number
	pool: PoolMinimal
	takerFee: BigNumberish
	approvalTarget: string
	approvalAmount: BigNumberish
	to: string
	data: BytesLike
}

export interface Domain {
	name: string
	version: string
	chainId: string
	verifyingContract: string
}

export interface InvalidQuote {
	quote: OrderbookQuote
	message: string
}

export interface PublishQuoteResponse {
	created: OrderbookQuote[]
	failed: InvalidQuote[]
	exists: OrderbookQuote[]
}

export interface GetOrdersResponse {
	validQuotes: OrderbookQuote[]
	invalidQuotes: InvalidQuote[]
}
