import { expect } from 'chai'

import { FRIDAY, nextYearOfMaturities, parseBigInt } from '../../src'

describe('Utils API', function (this: any) {
	this.timeout(30000)

	it('should create the next year of maturities', async () => {
		const maturities = nextYearOfMaturities()
		expect(maturities).to.not.be.empty

		for (let i = 0; i < maturities.length; i++) {
			const maturity = maturities[i]

			if (i >= 2) {
				expect(maturity.day()).to.equal(FRIDAY)
			}

			if (i >= 6) {
				expect(maturity.date()).to.be.greaterThan(22)
			}

			expect(maturity.isUTC()).to.be.true
			expect(maturity.hour()).to.equal(8)
			expect(maturity.minute()).to.equal(0)
			expect(maturity.second()).to.equal(0)
			expect(maturity.millisecond()).to.equal(0)
		}
	})
})

describe('Parse Number', function (this: any) {
	it('Should not cast number with decimals', async () => {
		const decimals = '151852378976868961'
		expect(parseBigInt(`0.${decimals}`, 18).toString()).to.be.eqls(decimals)
		expect(parseBigInt(`0.${decimals}`, 8).toString()).to.be.eqls(
			decimals.substring(0, 8)
		)
	})
})
