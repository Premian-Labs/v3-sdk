import 'mock-local-storage'
import { expect } from 'chai'
import { parseEther } from 'ethers'

import { Addresses, CHAINLINK_ETH, Premia } from '../../src'

describe('Token API', function (this: any) {
	let sdk: Premia

	this.timeout(30000)

	beforeEach(async () => {
		sdk = await Premia.initialize({ useTestnet: true, disableCache: false })
	})

	it('should correctly load the ETH token', async () => {
		const token = await sdk.tokens.getToken(CHAINLINK_ETH.toLowerCase())
		expect(token.address).to.equal(CHAINLINK_ETH.toLowerCase())
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('ETH')
		expect(token.name).to.equal('Ether')
		expect(token.decimals).to.equal(18)
		expect(token.priceETH).to.equal(parseEther('1').toString())
		expect(token.isNative).to.equal(true)
		expect(token.isWrappedNative).to.equal(false)
	})

	it('should correctly load a token with multicall', async () => {
		sdk.setDisableCache(true)
		sdk.setSkipSubgraph(true)

		const token = await sdk.tokens.getToken(Addresses[sdk.chainId].WETH)
		expect(token.address).to.equal(Addresses[sdk.chainId].WETH)
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('WETH')
		expect(token.name).to.equal('Wrapped Ether')
		expect(token.decimals).to.equal(18)
		expect(token.priceETH).to.equal(parseEther('1').toString())
		expect(token.isNative).to.equal(false)
		expect(token.isWrappedNative).to.equal(true)
	})

	it('should correctly load tokens', async () => {
		sdk.setSkipSubgraph(false)

		const tokens = await sdk.tokens.getTokens([CHAINLINK_ETH.toLowerCase()])
		expect(tokens.length).to.equal(1)

		const token = tokens[0]
		expect(token.address).to.equal(CHAINLINK_ETH.toLowerCase())
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('ETH')
		expect(token.name).to.equal('Ether')
		expect(token.decimals).to.equal(18)
		expect(token.priceETH).to.equal(parseEther('1').toString())
		expect(token.isNative).to.equal(true)
		expect(token.isWrappedNative).to.equal(false)
	})

	it('should correctly load tokens with multicall', async () => {
		sdk.setSkipSubgraph(true)

		const tokens = await sdk.tokens.getTokens([Addresses[sdk.chainId].USDC])
		expect(tokens.length).to.equal(1)

		const token = tokens[0]
		expect(token.address).to.equal(Addresses[sdk.chainId].USDC)
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('USDC')
		expect(token.name).to.equal('USDC')
		expect(token.decimals).to.equal(6)
		expect(token.isNative).to.equal(false)
		expect(token.isWrappedNative).to.equal(false)
	})

	it('should correctly load token list', async () => {
		sdk.setSkipSubgraph(false)

		const tokens = await sdk.tokens.getTokenList([
			{
				chainId: sdk.chainId,
				address: CHAINLINK_ETH.toLowerCase(),
				symbol: 'ETH',
				name: 'Ether',
				decimals: 18,
			},
		])
		expect(tokens.length).to.equal(1)

		const token = tokens[0]
		expect(token.address).to.equal(
			Addresses[sdk.chainId].CHAINLINK_ETH.toLowerCase()
		)
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('ETH')
		expect(token.name).to.equal('Ether')
		expect(token.decimals).to.equal(18)
		expect(token.priceETH).to.equal(parseEther('1').toString())
		expect(token.isNative).to.equal(true)
		expect(token.isWrappedNative).to.equal(false)
	})

	it('should correctly load token list with multicall', async () => {
		sdk.setSkipSubgraph(true)

		const tokens = await sdk.tokens.getTokenList([
			{
				chainId: sdk.chainId,
				address: Addresses[sdk.chainId].WETH,
				symbol: 'WETH',
				name: 'Wrapped Ether',
				decimals: 18,
			},
		])
		expect(tokens.length).to.equal(1)

		const token = tokens[0]
		expect(token.address).to.equal(Addresses[sdk.chainId].WETH)
		expect(token.chainId).to.equal(sdk.chainId)
		expect(token.symbol).to.equal('WETH')
		expect(token.name).to.equal('Wrapped Ether')
		expect(token.decimals).to.equal(18)
		expect(token.priceETH).to.equal(parseEther('1').toString())
		expect(token.isNative).to.equal(false)
		expect(token.isWrappedNative).to.equal(true)
	})
})
