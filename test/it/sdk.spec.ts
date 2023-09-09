import { JsonRpcProvider, toBigInt, Wallet } from 'ethers'
import { expect } from 'chai'

import { Premia, SupportedChainId } from '../../src'

describe('SDK', function (this: any) {
	const privateKey = process.env.TESTNET_PRIVATE_KEY

	this.timeout(15000)

	it('should be able to be instantiated with no params and no browser provider', async () => {
		const sdk = await Premia.initialize({ useTestnet: true })
		expect(sdk.provider).instanceOf(JsonRpcProvider)
		expect(sdk.orderbookProvider).instanceOf(JsonRpcProvider)

		const network = await sdk.provider.getNetwork()
		expect(network.chainId).to.be.equal(
			toBigInt(SupportedChainId.ARBITRUM_GOERLI)
		)
	})

	it('should be able to be instantiated with only a privateKey', async () => {
		const sdk = await Premia.initialize({ privateKey, useTestnet: true })

		expect(sdk.provider).instanceOf(JsonRpcProvider)
		expect(sdk.orderbookProvider).instanceOf(JsonRpcProvider)
		expect(sdk.signer).instanceOf(Wallet)

		const network = await sdk.provider.getNetwork()
		expect(network.chainId).to.be.equal(
			toBigInt(SupportedChainId.ARBITRUM_GOERLI)
		)
	})

	it('should correctly instantiate with a provider', async () => {
		const sdk = await Premia.initialize({
			provider: 'https://arb1.arbitrum.io/rpc',
			useTestnet: false,
		})
		expect(sdk.provider).instanceOf(JsonRpcProvider)
		expect(sdk.orderbookProvider).instanceOf(JsonRpcProvider)

		const network = await sdk.provider.getNetwork()
		expect(network.chainId).to.be.equal(toBigInt(SupportedChainId.ARBITRUM))
	})

	it('should correctly instantiate signer with a privateKey', async () => {
		const sdk = await Premia.initialize({
			provider: 'https://arb1.arbitrum.io/rpc',
			privateKey,
			orderbookPrivateKey: privateKey,
			useTestnet: false,
		})
		expect(sdk.provider).instanceOf(JsonRpcProvider)
		expect(sdk.signer).instanceOf(Wallet)
		expect(sdk.orderbookProvider).instanceOf(JsonRpcProvider)
		expect(sdk.orderbookSigner).instanceOf(Wallet)

		const network = await sdk.provider.getNetwork()
		expect(network.chainId).to.be.equal(toBigInt(SupportedChainId.ARBITRUM))
	})

	it('should return the correct network ids', async () => {
		let sdk = await Premia.initialize({ useTestnet: false })
		let chainId = (await sdk.provider.getNetwork()).chainId
		let orderbookChainId = (await sdk.orderbookProvider?.getNetwork())?.chainId
		expect(chainId).to.be.equal(toBigInt(SupportedChainId.ARBITRUM))
		expect(orderbookChainId).to.be.equal(
			toBigInt(SupportedChainId.ARBITRUM_NOVA)
		)

		sdk = await Premia.initialize({ useTestnet: true })
		chainId = (await sdk.provider.getNetwork()).chainId
		orderbookChainId = (await sdk.orderbookProvider?.getNetwork())?.chainId
		expect(chainId).to.be.equal(toBigInt(SupportedChainId.ARBITRUM_GOERLI))
		expect(orderbookChainId).to.be.equal(
			toBigInt(SupportedChainId.ARBITRUM_GOERLI)
		)
	})
})
