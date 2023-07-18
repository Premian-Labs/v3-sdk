import 'mock-local-storage'
import { expect } from 'chai'

import { nextYearOfMaturities } from '../../src'

describe('Utils API', function (this: any) {
	this.timeout(30000)

	it('should create the next year of maturities', async () => {
		const maturities = nextYearOfMaturities()
		expect(maturities).to.not.be.empty

		for (let maturity of maturities) {
			expect(maturity.isUTC()).to.be.true
			expect(maturity.hour()).to.equal(8)
			expect(maturity.minute()).to.equal(0)
			expect(maturity.second()).to.equal(0)
			expect(maturity.millisecond()).to.equal(0)
		}
	})
})
