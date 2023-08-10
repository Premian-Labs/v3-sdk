import 'mock-local-storage'
import { expect } from 'chai'

import {FillableQuote, parseBigInt, Premia} from '../../src'


describe('Option API', function (this: any) {
	let sdk: Premia

	this.timeout(15000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true, disableCache: false })
	})

	it('should get the correct strike increment', async () => {
		const strikeIncrement = sdk.options.getStrikeIncrement(
			parseBigInt('2000')
		)
		expect(strikeIncrement).to.equal(parseBigInt('100'))
	})

	it('should suggest strikes for a spot price', async () => {
		const suggested = sdk.options.getSuggestedStrikes(parseBigInt('2000'))
		expect(suggested).to.not.be.empty
	})
})
