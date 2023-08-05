import 'mock-local-storage'
import { expect } from 'chai'

import {
	Addresses,
	nextYearOfMaturities,
	PoolKey,
	PoolMinimal,
	Premia,
	SupportedChainId,
	TokenPairOrId,
} from '../../src'
import { parseEther, toBigInt } from 'ethers'
import PremiaSubgraph from '../../src/services/subgraph'

async function getFirstPoolAddress(
	subgraph: PremiaSubgraph,
	pair: TokenPairOrId
): Promise<string> {
	const _pairId = subgraph._parsePairId(pair)
	let pools = await subgraph.getPoolsForPairId(_pairId)
	return pools[0].address
}

describe('Pool API', async function (this: any) {
	let sdk: Premia
	let possibleMaturities: number[]
	let poolKey: PoolKey
	let basePool: PoolMinimal

	this.timeout(30000)

	const pair: TokenPairOrId = {
		base: {
			chainId: SupportedChainId.ARBITRUM_GOERLI,
			name: 'Test Wrapped Ether',
			address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
			symbol: 'testWETH',
			decimals: 18,
			logoURI:
				'https://raw.githubusercontent.com/asset-projects/token-list/main/public/eth.png',
			tags: ['native'],
		},
		baseAdapterType: 'Chainlink',
		quote: {
			chainId: SupportedChainId.ARBITRUM_GOERLI,
			address: Addresses[SupportedChainId.ARBITRUM_GOERLI].USDC,
			name: 'USD Coin',
			symbol: 'USDC',
			decimals: 6,
			logoURI:
				'https://raw.githubusercontent.com/asset-projects/token-list/main/public/usdc.png',
			tags: ['stablecoin'],
		},
		quoteAdapterType: 'Chainlink',
		decimals: 18,
		priceOracleAddress:
			Addresses[SupportedChainId.ARBITRUM_GOERLI].CHAINLINK_ORACLE_ADAPTER,
		name: 'WETH Chainlink / USDC Chainlink',
		tags: ['native', 'stablecoin'],
	}

	beforeEach(async () => {
		sdk = await Premia.initialize({
			useTestnet: true,
			disableCache: false,
			privateKey: process.env.TESTNET_PRIVATE_KEY,
		})

		possibleMaturities = nextYearOfMaturities().map((m) => m.unix())
		poolKey = {
			base: Addresses[sdk.chainId].TEST_WETH,
			quote: Addresses[sdk.chainId].USDC,
			oracleAdapter: Addresses[sdk.chainId].CHAINLINK_ORACLE_ADAPTER,
			maturity: possibleMaturities[4],
			strike: parseEther('2000'),
			isCallPool: true,
		}
	})

	it('should correctly load base pool for key', async () => {
		basePool = await sdk.pools.getPoolMinimalFromKey(poolKey)

		expect(basePool).to.not.be.undefined
		expect(basePool?.pair.base.symbol).to.equal('testWETH')
		expect(basePool?.pair.quote.symbol).to.equal('USDC')
		expect(basePool?.pair.priceOracleAddress).to.equal(
			Addresses[sdk.chainId].CHAINLINK_ORACLE_ADAPTER
		)
		expect(basePool?.strike.toString()).to.equal(poolKey.strike.toString())
		expect(basePool?.maturity.toString()).to.equal(poolKey.maturity.toString())
		expect(basePool?.isCall).to.be.true
	})

	it('should correct deploy pool', async () => {
		if (basePool.initialized) return

		console.log('Deploying pool')

		sdk.setDisableCache(true)

		const response = await sdk.pools.deployWithKey(poolKey)
		await response.wait(1)
		basePool = await sdk.pools.getPoolMinimalFromKey(poolKey)

		sdk.setDisableCache(false)

		expect(basePool.initialized).to.be.true
	})

	it('should correctly load poolsForPair', async () => {
		basePool = await sdk.pools.getPoolMinimalFromKey(poolKey)
		const poolsForPair = await sdk.pools.getPoolsForPair(basePool.pair)
		expect(poolsForPair).to.not.be.empty
	})

	it('should load initializationFee from contract', async () => {
		const poolAddress = await getFirstPoolAddress(sdk.subgraph, pair)
		const _poolKey = await sdk.pools.getPoolKeyFromAddress(poolAddress)

		const maturities = nextYearOfMaturities()

		_poolKey.maturity = toBigInt(maturities[maturities.length - 1].unix())

		const fee = await sdk.pools.initializationFee(_poolKey)

		expect(fee).to.not.be.undefined
		expect(fee.toString()).to.not.equal('0')
	})

	it('should be able to get the market price for a pool', async () => {
		const poolAddress = await getFirstPoolAddress(sdk.subgraph, pair)
		const marketPrice = await sdk.pools.marketPrice(poolAddress)

		expect(marketPrice).to.not.be.undefined
		expect(marketPrice.toString()).to.not.equal('0')
	})
})
