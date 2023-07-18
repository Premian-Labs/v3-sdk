import fetch from 'cross-fetch'
import { get } from 'lodash'

import { CoingeckoChainKey } from './constants'

export class Coingecko {
	/**
	 * @inheritdoc {@link PremiaConfig.coingeckoProApiKey}
	 */
	uri: string
	apiKey?: string

	constructor(baseUri: string, apiKey?: string) {
		this.uri = baseUri
		this.apiKey = apiKey
	}

	createUrl(path: string): string {
		if (this.apiKey) {
			const modifierSymbol = path.includes('?') ? '&' : '?'
			return `${this.uri}${path}${modifierSymbol}x_cg_pro_api_key=${this.apiKey}`
		}

		return `${this.uri}${path}`
	}

	async getPrice(
		coinName: string,
		currency: string = 'usd'
	): Promise<string | null> {
		const geckoUrl = this.createUrl(
			`/coins/markets?vs_currency=${currency}&ids=${coinName}`
		)

		try {
			const result = await fetch(geckoUrl)
			const priceJson = await result.json()
			return get(priceJson, '0.current_price', null)
		} catch (err) {
			console.error(`Error fetching price for ${coinName}:`, err)
			return null
		}
	}

	async getPriceByAddress(
		tokenAddress: string,
		chainId: number,
		currency: string = 'usd'
	): Promise<string | null> {
		const platform =
			CoingeckoChainKey[chainId as keyof typeof CoingeckoChainKey]

		if (platform) {
			try {
				const url = this.createUrl(
					`/simple/token_price/${platform}?contract_addresses=${tokenAddress}&vs_currencies=${currency}`
				)
				const data = await fetch(url).then((response) => response.json())
				const key = Object.keys(data)[0]
				return data[key] ? data[key][currency] : null
			} catch (err) {
				console.error('Error fetching price from coingecko', err)
				return null
			}
		} else {
			return null
		}
	}

	async getPricesByAddress(
		tokenAddresses: string[],
		chainId: number,
		currency: string = 'usd'
	): Promise<(string | null)[] | null> {
		const platform =
			CoingeckoChainKey[chainId as keyof typeof CoingeckoChainKey]

		if (platform) {
			try {
				const geckoCallPromises = tokenAddresses.map((address) => {
					const url = this.createUrl(
						`/simple/token_price/${platform}?contract_addresses=${address}&vs_currencies=${currency}`
					)
					return fetch(url).then((response) => response.json())
				})
				const data = await Promise.all(geckoCallPromises)

				const prices = data.map((item) => {
					const key = Object.keys(item)[0]
					return item[key] ? item[key][currency] : null
				})

				return prices
			} catch (err) {
				console.error('Error fetching prices from coingecko', err)
				return null
			}
		} else {
			return null
		}
	}

	async get24HourPriceChange(
		coinName: string,
		currency: string = 'usd'
	): Promise<string | null> {
		const geckoUrl = this.createUrl(
			`/coins/markets?vs_currency=${currency}&ids=${coinName}&include_24hr_change=true`
		)

		try {
			const result = await fetch(geckoUrl)
			const priceJson = await result.json()
			return get(priceJson, '0.price_change_percentage_24h', null)
		} catch (err) {
			console.error(`Error fetching 24 hour price change for ${coinName}:`, err)
			return null
		}
	}
}
