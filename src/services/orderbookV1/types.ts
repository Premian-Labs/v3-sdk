import { OrderbookQuote } from '../../entities'
import { BigNumberish } from 'ethers'

export type ChannelType = 'QUOTES' | 'RFQ'
export interface WSFilterMessage {
	type: 'FILTER'
	channel: ChannelType
	body: {
		poolAddress?: string
		side?: 'bid' | 'ask'
		chainId: string
		size?: string // bigint string representation
		taker?: string
		provider?: string
	}
}

export interface WSUnsubscribeMessage {
	type: 'UNSUBSCRIBE'
	channel: ChannelType
	body: null
}

export interface WSRFQRequest {
	type: 'RFQ'
	body: {
		poolAddress: string
		side: 'bid' | 'ask'
		chainId: string
		size: string // bigint string representation
		taker: string
	}
}

export interface AuthMessage {
	type: 'AUTH'
	apiKey: string
	body: null
}

export interface WSRFQMessage {
	type: 'RFQ'
	poolAddress: string
	side: 'bid' | 'ask'
	chainId: string
	size: string
	taker: string
}

export interface WSPostQuoteMessage {
	type: 'POST_QUOTE'
	body: OrderbookQuote
}

export interface WSDeleteQuoteMessage {
	type: 'DELETE_QUOTE'
	body: OrderbookQuote
}

export interface WSInfoMessage {
	type: 'INFO'
	body: null
	message: string
}

export interface WSErrorMessage {
	type: 'ERROR'
	body: null
	message: string
}

export interface LiquiditySummaryRequest {
	baseToken: string
	isCall: boolean
	side: 'bid' | 'ask'
	quoteTokens: string[]
	provider?: string
}
export interface GroupByMaturityRequest extends LiquiditySummaryRequest {
	strike?: BigInt
	groupBy: 'MATURITY'
}

export interface GroupByStrikeRequest extends LiquiditySummaryRequest {
	maturity?: number
	groupBy: 'STRIKE'
}

export interface GroupByMaturityResponse {
	maturity: number
	totalValueLockedUSD: BigInt
}

export interface GroupByStrikeResponse {
	strike: BigInt
	totalValueLockedUSD: BigInt
}
