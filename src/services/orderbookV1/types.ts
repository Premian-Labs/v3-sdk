import { OrderbookQuote, PoolKey } from '../../entities'

export type ChannelType = 'QUOTES' | 'RFQ'

export interface AuthMessage {
	type: 'AUTH'
	apiKey: string
	body: null
}

export interface WSFilterMessage {
	type: 'FILTER'
	channel: ChannelType
	body: {
		poolAddress?: string
		side?: 'bid' | 'ask'
		chainId: string
		size?: string
		taker?: string
		provider?: string
	}
}

export interface WSUnsubscribeMessage {
	type: 'UNSUBSCRIBE'
	channel: ChannelType
	body: null
}

export interface WSRFQMessage {
	type: 'RFQ'
	body: {
		poolKey: PoolKey
		side: 'bid' | 'ask'
		chainId: string
		size: string
		taker: string
	}
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
	groupBy: 'maturity'
}

export interface GroupByStrikeRequest extends LiquiditySummaryRequest {
	maturity?: number
	groupBy: 'strike'
}

export interface GroupByMaturityResponse {
	maturity: number
	totalContracts: BigInt
}

export interface GroupByStrikeResponse {
	strike: BigInt
	totalContracts: BigInt
}
