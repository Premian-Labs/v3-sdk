import 'mock-local-storage'
import { expect } from 'chai'

import { Addresses, parseBigInt, Premia } from '../../src'

describe('Option API', function (this: any) {
	let sdk: Premia

	this.timeout(15000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true, disableCache: false })
	})

	it('should get the correct strike increment', async () => {
		let strikeIncrement = sdk.options.getStrikeIncrement(parseBigInt('2000'))
		expect(strikeIncrement).to.equal(parseBigInt('100'))

		strikeIncrement = sdk.options.getStrikeIncrement(parseBigInt('100'))
		expect(strikeIncrement).to.equal(parseBigInt('10'))

		strikeIncrement = sdk.options.getStrikeIncrement(parseBigInt('15'))
		expect(strikeIncrement).to.equal(parseBigInt('1'))
	})

	it('should suggest strikes for a spot price', async () => {
		const suggested = sdk.options.getSuggestedStrikes(parseBigInt('2000'))
		expect(suggested).to.not.be.empty
	})

	it('should get the most liquid option for a token', async () => {
		sdk = await Premia.initialize({ useTestnet: false })

		try {
			const pool = await sdk.options.getMostLiquidOptionForToken(
				Addresses[sdk.chainId].WETH,
				{
					isCall: true,
					isBuy: true,
				}
			)

			expect(pool).to.not.be.null
		} catch (err) {
			console.error('Err', err)
		}
	})
})
