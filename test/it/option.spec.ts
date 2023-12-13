import { expect } from 'chai'

import { Premia } from '../../src'

describe('Option API', function (this: any) {
	let sdk: Premia

	this.timeout(30000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true })
	})

	it('should get the correct strike increment', async () => {
		let strikeIncrement = sdk.options.getStrikeInterval(2000)
		expect(strikeIncrement).to.equal(100)

		strikeIncrement = sdk.options.getStrikeInterval(100)
		expect(strikeIncrement).to.equal(10)

		strikeIncrement = sdk.options.getStrikeInterval(15)
		expect(strikeIncrement).to.equal(1)
	})

	it('should suggest strikes for a spot price', async () => {
		const spotPrice = 1000
		const suggestedStrikes = sdk.options.getSuggestedStrikes(spotPrice)

		expect(suggestedStrikes).to.not.be.empty

		const below10k = suggestedStrikes.filter((strike) => strike < spotPrice)
		const above10k = suggestedStrikes.filter((strike) => strike > spotPrice)

		expect(
			below10k.every((strike, i) => {
				const nextStrike = below10k[i + 1]
				const strikeRange = nextStrike - strike

				// end of array
				if (Number.isNaN(strikeRange)) return true

				return nextStrike - strike === 50
			})
		).to.be.true

		expect(
			above10k.every((strike, i) => {
				const nextStrike = above10k[i + 1]
				const strikeRange = nextStrike - strike

				// end of array
				if (Number.isNaN(strikeRange)) return true

				return nextStrike - strike === 100
			})
		).to.be.true
	})
})
