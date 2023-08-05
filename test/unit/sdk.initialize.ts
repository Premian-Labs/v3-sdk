import { JsonRpcProvider, Wallet } from 'ethers'
import { expect } from 'chai'

import { Premia } from '../../src'

const dotenv = require('dotenv')
dotenv.config()

describe('SDK.initialize', function (this: any) {
	this.timeout(15000)

	const privateKey = process.env.TESTNET_PRIVATE_KEY

	it('should be able to be instantiated with no params and no browser provider', async () => {
		const premia = await Premia.initialize()

		expect(premia.disableCache).eq(false)
		expect(premia.skipSubgraph).eq(false)
		expect(premia.subgraph.uri).eq(
			'https://api.thegraph.com/subgraphs/name/totop716/premia-v3'
		)
		expect(premia.chainId).eq(42161)
		expect(premia.apiBaseUri).eq('https://test.orderbook.premia.finance')
		expect(premia.apiWsUri).eq('wss://test.quotes.premia.finance')
		expect(premia.coingeckoBaseUri).eq('https://api.coingecko.com/api/v3')
		expect(premia.coingeckoProApiKey).eq(undefined)
		expect(premia.providerCredentials.rpcUrl).eq('https://arb1.arbitrum.io/rpc')
		expect(premia.signerCredentials).eq(undefined)
		expect(premia.novaProviderCredentials!.rpcUrl).eq(
			'https://nova.arbitrum.io/rpc'
		)
		expect(premia.novaSignerCredentials).eq(undefined)

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)

		const network = await premia.provider.getNetwork()
		expect(network.chainId).to.be.equal(42161n)

		const novaNetwork = await premia.novaProvider!.getNetwork()
		expect(novaNetwork.chainId).to.be.equal(42170n)
	})

	it('should be able to be instantiated with useTestnet=true', async () => {
		const premia = await Premia.initialize({
			subgraphUri:
				'https://api.thegraph.com/subgraphs/name/totop716/premia-v3',
			provider: 'https://rpc.ankr.com/eth_goerli',
			chainId: 5,
		})

		expect(premia.disableCache).eq(false)
		expect(premia.skipSubgraph).eq(false)
		expect(premia.subgraph.uri).eq(
			'https://api.thegraph.com/subgraphs/name/totop716/premia-v3'
		)
		expect(premia.chainId).eq(5)
		expect(premia.apiBaseUri).eq('https://test.orderbook.premia.finance')
		expect(premia.apiWsUri).eq('wss://test.quotes.premia.finance')
		expect(premia.coingeckoBaseUri).eq('https://api.coingecko.com/api/v3')
		expect(premia.coingeckoProApiKey).eq(undefined)
		expect(premia.providerCredentials.rpcUrl).eq(
			'https://rpc.ankr.com/eth_goerli'
		)
		expect(premia.signerCredentials).eq(undefined)
		expect(premia.novaProviderCredentials!.rpcUrl).eq(
			'https://nova.arbitrum.io/rpc'
		)
		expect(premia.novaSignerCredentials).eq(undefined)

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)

		const network = await premia.provider.getNetwork()
		expect(network.chainId).to.be.equal(5n)

		const novaNetwork = await premia.novaProvider!.getNetwork()
		expect(novaNetwork.chainId).to.be.equal(42170n)
	})

	it('should be able to be instantiated with only a privateKey for both arbitrum and argitrum nova', async () => {
		const premia = await Premia.initialize({
			subgraphUri:
				'https://api.thegraph.com/subgraphs/name/totop716/premia-v3',
			provider: 'https://rpc.ankr.com/eth_goerli',
			chainId: 5,
			privateKey: privateKey,
		})

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)
		expect(premia.signer).instanceOf(Wallet)

		expect(premia.disableCache).eq(false)
		expect(premia.skipSubgraph).eq(false)
		expect(premia.subgraph.uri).eq(
			'https://api.thegraph.com/subgraphs/name/totop716/premia-v3'
		)
		expect(premia.chainId).eq(5)
		expect(premia.apiBaseUri).eq('https://test.orderbook.premia.finance')
		expect(premia.apiWsUri).eq('wss://test.quotes.premia.finance')
		expect(premia.coingeckoBaseUri).eq('https://api.coingecko.com/api/v3')
		expect(premia.coingeckoProApiKey).eq(undefined)
		expect(premia.providerCredentials.rpcUrl).eq(
			'https://rpc.ankr.com/eth_goerli'
		)
		expect(premia.signerCredentials!.privateKey).eq(privateKey)
		expect(premia.novaProviderCredentials!.rpcUrl).eq(
			'https://nova.arbitrum.io/rpc'
		)
		expect(premia.novaSignerCredentials).eq(undefined)

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)

		const network = await premia.provider.getNetwork()
		expect(network.chainId).to.be.equal(5n)

		const novaNetwork = await premia.novaProvider!.getNetwork()
		expect(novaNetwork.chainId).to.be.equal(42170n)
	})

	it('should be able to be instantiated with only a privateKey', async () => {
		const premia = await Premia.initialize({
			privateKey: privateKey,
			novaPrivateKey: privateKey,
		})
		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)
		expect(premia.signer).instanceOf(Wallet)

		expect(premia.disableCache).eq(false)
		expect(premia.skipSubgraph).eq(false)
		expect(premia.subgraph.uri).eq(
			'https://api.thegraph.com/subgraphs/name/totop716/premia-v3'
		)
		expect(premia.chainId).eq(42161)
		expect(premia.apiBaseUri).eq('https://test.orderbook.premia.finance')
		expect(premia.apiWsUri).eq('wss://test.quotes.premia.finance')
		expect(premia.coingeckoBaseUri).eq('https://api.coingecko.com/api/v3')
		expect(premia.coingeckoProApiKey).eq(undefined)
		expect(premia.providerCredentials.rpcUrl).eq('https://arb1.arbitrum.io/rpc')
		expect(premia.signerCredentials!.privateKey).eq(privateKey)
		expect(premia.novaProviderCredentials!.rpcUrl).eq(
			'https://nova.arbitrum.io/rpc'
		)
		expect(premia.novaSignerCredentials!.privateKey).eq(privateKey)

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)

		const network = await premia.provider.getNetwork()
		expect(network.chainId).to.be.equal(42161n)

		const novaNetwork = await premia.novaProvider!.getNetwork()
		expect(novaNetwork.chainId).to.be.equal(42170n)
	})

	it('should be able to use anvil network with localhost as provider', async () => {
		const premia = await Premia.initialize({
			useTestnet: true,
			provider: 'http://127.0.0.1:8545',
			privateKey: privateKey,
			novaPrivateKey: privateKey,
		})

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)
		expect(premia.signer).instanceOf(Wallet)

		expect(premia.disableCache).eq(false)
		expect(premia.skipSubgraph).eq(false)
		expect(premia.subgraph.uri).eq(
			'https://api.thegraph.com/subgraphs/name/totop716/premia-v3'
		)
		expect(premia.chainId).eq(421613)
		expect(premia.apiBaseUri).eq('https://test.orderbook.premia.finance')
		expect(premia.apiWsUri).eq('wss://test.quotes.premia.finance')
		expect(premia.coingeckoBaseUri).eq('https://api.coingecko.com/api/v3')
		expect(premia.coingeckoProApiKey).eq(undefined)
		expect(premia.providerCredentials.rpcUrl).eq('http://127.0.0.1:8545')
		expect(premia.signerCredentials!.privateKey).eq(privateKey)
		expect(premia.novaProviderCredentials!.rpcUrl).eq(
			'https://nova.arbitrum.io/rpc'
		)
		expect(premia.novaSignerCredentials!.privateKey).eq(privateKey)

		expect(premia.provider).instanceOf(JsonRpcProvider)
		expect(premia.novaProvider).instanceOf(JsonRpcProvider)

		const network = await premia.provider.getNetwork()
		expect(network.chainId).to.be.equal(421613n)

		const novaNetwork = await premia.novaProvider!.getNetwork()
		expect(novaNetwork.chainId).to.be.equal(42170n)
	})
})
