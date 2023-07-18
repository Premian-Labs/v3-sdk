import { OrderbookQuote} from '../../entities'

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
