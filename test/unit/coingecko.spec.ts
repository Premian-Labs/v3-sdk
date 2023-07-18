import { Coingecko } from '../../src'
import { expect } from 'chai'

describe('Coingecko', () => {
	it('should properly initialize coingecko', () => {
		const coingecko = new Coingecko('https://api.coingecko.com/api/v3')

		expect(coingecko.uri).to.eq('https://api.coingecko.com/api/v3')
	})
})
