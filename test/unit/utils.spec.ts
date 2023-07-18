import { snapToValidRange } from '../../src/utils/range'
import { parseEther } from 'ethers'
import { OrderType } from '../../src'
import { expect } from 'chai'

describe('Utils', () => {
	describe('#snapToValidRange', async () => {
		let tests = [
			{
				input: {
					lower: '0.001',
					upper: '0.002',
					orderType: OrderType.COLLATERAL_SHORT,
				},
				output: { lower: '0.001', upper: '0.002' },
			},
			{
				input: {
					lower: '0.001',
					upper: '0.005',
					orderType: OrderType.LONG_COLLATERAL,
				},
				output: { lower: '0.001', upper: '0.005' },
			},
			{
				input: {
					lower: '0.001',
					upper: '0.007',
					orderType: OrderType.COLLATERAL_SHORT,
				},
				output: { lower: '0.001', upper: '0.006' },
			},
			{
				input: {
					lower: '0.001',
					upper: '0.004',
					orderType: OrderType.LONG_COLLATERAL,
				},
				output: { lower: '0.002', upper: '0.004' },
			},
			{
				input: {
					lower: '0.201',
					upper: '1',
					orderType: OrderType.COLLATERAL_SHORT,
				},
				output: { lower: '0.201', upper: '0.841' },
			},
			{
				input: {
					lower: '0.001',
					upper: '0.8',
					orderType: OrderType.LONG_COLLATERAL,
				},
				output: { lower: '0.16', upper: '0.8' },
			},
		]
		tests.forEach((test) => {
			it(`should work for ${test.input.lower} and ${test.output.upper}`, () => {
				let output = snapToValidRange(
					parseEther(test.input.lower),
					parseEther(test.input.upper),
					test.input.orderType
				)

				expect(output.lower).to.eq(parseEther(test.output.lower))
				expect(output.upper).to.eq(parseEther(test.output.upper))
			})
		})
	})
})
