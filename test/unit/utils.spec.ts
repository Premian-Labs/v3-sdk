import { snapToValidRange } from '../../src/utils/range'
import {parseEther, toBigInt} from 'ethers'
import {formatTokenId, OrderType, parseTokenId} from '../../src'
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
	describe('#formatTokenId', async () => {
		let tests = [
			{
				input: {
					version: 1,
					orderType: OrderType.LONG_COLLATERAL,
					operator: '0x1000000000000000000000000000000000000001',
					lower: parseEther('0.001'),
					upper: parseEther('1'),
				},
				output: { tokenId: toBigInt('7237005577332262213976347335096030136599738132346032765157312649934076354561') },
			}
		]
		tests.forEach((test) => {
			it(``, () => {
				let output = formatTokenId(test.input)
				expect(output).to.eq(test.output.tokenId)
			})
		})
	})
	describe('#parseTokenId', async () => {
		let tests = [
			{
				input: { tokenId: toBigInt('7237005577332262213976347335096030136599738132346032765157312649934076354561') },
				output: {
					version: 1,
					orderType: OrderType.LONG_COLLATERAL,
					operator: '0x1000000000000000000000000000000000000001',
					lower: parseEther('0.001'),
					upper: parseEther('1'),
				},
			}
		]
		tests.forEach((test) => {
			it(``, () => {
				let output = parseTokenId(test.input.tokenId)
				expect(output.version).to.eq(test.output.version)
				expect(output.orderType).to.eq(test.output.orderType)
				expect(output.operator).to.eq(test.output.operator)
				expect(output.lower).to.eq(test.output.lower)
				expect(output.upper).to.eq(test.output.upper)
			})
		})
	})
})
