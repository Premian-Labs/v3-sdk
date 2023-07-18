import 'mock-local-storage'
import { expect } from 'chai'

import { parseBigInt, Premia, Token } from '../../src'

describe('Option API', function (this: any) {
	let sdk: Premia
	let baseToken: Token

	this.timeout(15000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true, disableCache: false })

		const defaultBaseTokens = await sdk.options.getDefaultBaseTokens()
		baseToken = defaultBaseTokens[0]
	})

	it('should correctly load token lists', async () => {
		const defaultBaseTokens = await sdk.options.getDefaultBaseTokens()

		expect(defaultBaseTokens.length).to.be.greaterThan(0)
		expect(defaultBaseTokens.find((token) => token.symbol === 'WETH')).to.not.be
			.undefined

		const defaultQuoteTokens = await sdk.options.getDefaultQuoteTokens()

		expect(defaultQuoteTokens.length).to.be.greaterThan(0)
		expect(defaultQuoteTokens.find((token) => token.symbol === 'WETH')).to.not
			.be.undefined
	})

	it('should correctly load pair list', async () => {
		const pairList = await sdk.options.getDefaultPairs()

		expect(pairList).to.not.be.undefined
		expect(pairList?.tokens.length).to.be.greaterThan(0)
		expect(pairList?.tokens[0].symbol).to.equal('WETH')
	})

	it('should get the correct strike increment', async () => {
		const strikeIncrement = await sdk.options.getStrikeIncrement(
			parseBigInt('2000')
		)
		expect(strikeIncrement).to.equal(parseBigInt('100'))
	})

	it('should suggest strikes for a spot price', async () => {
		const suggested = await sdk.options.getSuggestedStrikes(parseBigInt('2000'))
		expect(suggested).to.not.be.empty
	})
})
