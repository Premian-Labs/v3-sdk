import axios from 'axios'
import WebSocket from 'isomorphic-ws'

import {
	QuoteSaltOptionalT,
	QuoteWithSignatureT,
	SerializedQuoteSaltOptional,
	OrderbookQuote
} from '../../entities'
import {
	AuthMessage,
	ChannelType,
	WSDeleteQuoteMessage,
	WSErrorMessage,
	WSFilterMessage,
	WSInfoMessage,
	WSPostQuoteMessage,
	WSRFQMessage,
	WSRFQRequest,
	WSUnsubscribeMessage,
} from './types'

export class OrderbookV1 {
	/**
	 * The API key to use for fetching data from the Premia API.
	 *
	 * @see https://docs.premia.finance/api/authentication
	 */
	apiKey: string
	/**
	 * The base URI to use for fetching data from the Premia API.
	 *
	 * @see https://docs.premia.finance/api
	 */
	uri: string

	/**
	 * The base websocket URI to use for streaming data from the Premia API.
	 *
	 * @see https://docs.premia.finance/api
	 */
	wsUri: string

	/**
	 * This is the chain id of where orders will SETTLE (ie Arbitrum or Arbitrum Goerli)
	 */
	chainId: number

	private ws?: WebSocket

	constructor(baseUri: string, wsUri: string, apiKey: string, chainId: number) {
		this.uri = baseUri
		this.wsUri = wsUri
		this.apiKey = apiKey
		this.chainId = chainId
	}

	serializeQuotesWithSignature(
		quotes: QuoteWithSignatureT[]
	): QuoteWithSignatureT[] {
		return quotes.map((quote) => {
			return {
				poolKey: {
					base: quote.poolKey.base,
					quote: quote.poolKey.quote,
					oracleAdapter: quote.poolKey.oracleAdapter,
					strike: quote.poolKey.strike.toString(),
					maturity: Number(quote.poolKey.maturity),
					isCallPool: quote.poolKey.isCallPool,
				},
				chainId: this.chainId.toString(),
				provider: quote.provider,
				taker: quote.taker,
				price: quote.price.toString(),
				size: quote.size.toString(),
				isBuy: quote.isBuy,
				deadline: Number(quote.deadline),
				salt: Number(quote.salt),
				signature: {
					r: quote.signature.r,
					s: quote.signature.s,
					v: quote.signature.v,
				},
			}
		})
	}

	serializeQuote(quote: QuoteSaltOptionalT): SerializedQuoteSaltOptional {
		return {
			poolKey: {
				base: quote.poolKey.base,
				quote: quote.poolKey.quote,
				oracleAdapter: quote.poolKey.oracleAdapter,
				strike: quote.poolKey.strike.toString(),
				maturity: Number(quote.poolKey.maturity),
				isCallPool: quote.poolKey.isCallPool,
			},
			provider: quote.provider,
			taker: quote.taker,
			price: quote.price.toString(),
			size: quote.size.toString(),
			isBuy: quote.isBuy,
			deadline: Number(quote.deadline),
			salt: quote.salt ? Number(quote.salt) : undefined,
		}
	}

	async getQuotes(
		poolAddress: string,
		size: string,
		side: 'bid' | 'ask',
		provider?: string ,
		taker?: string,
		chainId: string = String(this.chainId)
	): Promise<OrderbookQuote[]> {
		const _poolAddress = `poolAddress=${poolAddress}`
		const _size = `&size=${size}`
		const _side = `&side=${side}`
		const _provider = provider ? `&provider=${provider}`: ''
		const _taker = taker ? `&taker=${taker}`: ''
		const _chainId = `&chainId=${chainId}`
		const url = `${this.uri}/quotes?${_poolAddress}${_size}${_side}${_provider}${_taker}${_chainId}`

		return this.getRequest(url)
	}

	async getRfqQuotes(
		poolAddress: string,
		side: 'bid' | 'ask',
		taker: string,
		chainId: string = String(this.chainId)
	): Promise<OrderbookQuote[]> {
		const _poolAddress = `poolAddress=${poolAddress}`
		const _side = `&side=${side}`
		const _taker = `&taker=${taker}`
		const _chainId = `&chainId=${chainId}`
		const url = `${this.uri}/rfq_quotes?${_poolAddress}${_side}${_chainId}${_taker}`

		return this.getRequest(url)
	}

	async getOrders(
		poolAddress?: string,
		size?: string,
		side?: 'bid' | 'ask',
		provider?: string,
		chainId: string = String(this.chainId)
	): Promise <OrderbookQuote[]> {
		const _poolAddress = poolAddress ? `poolAddress=${poolAddress}`: ''
		const _size = size ? `&size=${size}`: ''
		const _side = side ? `&side=${side}`: ''
		const _provider = provider ? `&provider=${provider}` : ''
		const _chainId = `&chainId=${chainId}`
		const url = `${this.uri}/orders?${_poolAddress}${_size}${_side}${_provider}${_chainId}`

		return this.getRequest(url)
	}

	async getRequest(_url: string) {
		try {
			const response = await axios.get(_url, {
				headers: {
					'x-apikey': this.apiKey,
				},
			})

			if (response.status !== 200) {
				console.error('Request failed: ', await response.data)
				throw new Error(`Failed to fetch quote: ${response.statusText}`)
			}

			if (!response.data) {
				throw new Error(`Error fetching response.data: ${response.data}`)
			}

			return response.data
		} catch (e) {
			console.error('Error fetching orderbook quotes: ', e)
			return []
		}
	}

	async publishQuotes(quotes: QuoteWithSignatureT[]): Promise<OrderbookQuote[]> {
		const _quotes = this.serializeQuotesWithSignature(quotes)

		const url = `${this.uri}/quotes`
		const response = await axios.post(url, _quotes, {
			headers: {
				'x-apikey': this.apiKey,
			},
		})

		if (response.status !== 200 && response.status !== 201) {
			console.error('Request failed: ', response.data)
			throw new Error(`Failed to publish quotes: ${response.statusText}`)
		}

		return response.data
	}

	async connect(callback?: (data: WSInfoMessage | WSErrorMessage) => void) {
		this.ws = new WebSocket(this.wsUri)

		return new Promise(async (resolve, reject) => {
			if (!this.ws) {
				reject('Failed to create websocket')
				return
			}

			this.ws.onopen = (event) => {
				const authMsg: AuthMessage = {
					type: 'AUTH',
					apiKey: this.apiKey,
					body: null,
				}

				event.target.send(JSON.stringify(authMsg))

				if (callback) {
					event.target.onmessage = (event) =>
						callback(JSON.parse(event.data as string))
				}
			}

			this.ws.onerror = (event) => {
				reject(event.error)
			}

			try {
				const connected = await this.waitForConnection()
				resolve(connected)
				return
			} catch (e) {
				reject(e)
			}

			resolve(false)
		})
	}

	/**
	 * Waits for the websocket to connect
	 * @param timeout timeout in milliseconds (default 10 seconds)
	 * @returns a promise that resolves to true if connected, false if not connected
	 */
	waitForConnection(timeout: number = 10000) {
		if (!this.isConnected()) {
			const start = new Date().getTime()

			return new Promise((resolve) => {
				const interval = setInterval(() => {
					if (this.isConnected()) {
						clearInterval(interval)
						resolve(true)
					}

					if (new Date().getTime() - start > timeout) {
						clearInterval(interval)
						resolve(false)
					}
				}, 30)
			})
		}

		return Promise.resolve(true)
	}

	async connectIfNotConnected(
		callback?: (data: WSInfoMessage | WSErrorMessage) => void
	) {
		if (!this.ws || !this.isConnected()) {
			try {
				await this.connect(callback)
			} catch (err) {
				console.error('Failed to connect to WS: ', err)
			}
		}

		return this.ws && this.isConnected()
	}

	isConnected() {
		return this.ws?.readyState === WebSocket.OPEN
	}

	isDisconnected() {
		return this.ws?.readyState === WebSocket.CLOSED
	}

	disconnect() {
		if (this.ws && this.isConnected()) {
			this.ws!.close()
		}
	}

	async subscribe(
		message: WSFilterMessage,
		callback: (
			data:
				| WSPostQuoteMessage
				| WSDeleteQuoteMessage
				| WSRFQMessage
				| WSInfoMessage
				| WSErrorMessage
		) => void
	) {
		if (await this.connectIfNotConnected(callback)) {
			this.ws!.send(JSON.stringify(message))
			this.ws!.onmessage = (event) => callback(JSON.parse(event.data as string))
		}
	}

	unsubscribe(
		channel: ChannelType,
		callback?: (data: WSInfoMessage | WSErrorMessage) => void
	) {
		if (this.ws?.readyState === WebSocket.OPEN) {
			const msg: WSUnsubscribeMessage = {
				type: 'UNSUBSCRIBE',
				channel: channel,
				body: null,
			}
			this.ws.send(JSON.stringify(msg))

			if (callback) {
				this.ws.onmessage = (event) =>
					callback(JSON.parse(event.data as string))
			}
		}
	}

	async publishRFQ(
		message: WSRFQRequest,
		callback?: (data: WSInfoMessage | WSErrorMessage) => void
	) {
		if (await this.connectIfNotConnected(callback)) {
			this.ws?.send(JSON.stringify(message))

			if (callback) {
				this.ws!.onmessage = (event) =>
					callback(JSON.parse(event.data as string))
			}
		}
	}
}

export default OrderbookV1
