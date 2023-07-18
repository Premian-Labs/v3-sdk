import PremiaSubgraph from '../../src/services/subgraph'
import { Addresses, SupportedChainId, TokenPairOrId } from '../../src'
import { expect } from 'chai'

describe('Token Pair Subgraph', function (this: any) {
	let subgraph: PremiaSubgraph

	this.timeout(30000)

	const pair: TokenPairOrId = {
		base: {
			chainId: 5,
			address: '0xC2ECb8563800B523426c3328EeC1F7771D433C9c',
			name: '(Mintable Fake) Wrapped Ether',
			symbol: 'testWETH',
			decimals: 18,
			logoURI:
				'https://raw.githubusercontent.com/asset-projects/token-list/main/public/eth.png',
			tags: ['native'],
		},
		baseAdapterType: 'Chainlink',
		quote: {
			chainId: 5,
			address: '0x16fA8D635311fc4DA9A2f8793EE016670b0C6Ed2',
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
			Addresses[SupportedChainId.GOERLI].CHAINLINK_ORACLE_ADAPTER,
		name: 'Fake WETH Chainlink / USDC Chainlink',
		tags: ['native', 'stablecoin'],
	}

	beforeEach(async () => {
		subgraph = new PremiaSubgraph(
			'https://api.thegraph.com/subgraphs/name/premiafinance/v3-goerli'
		)
	})

	it('should have information on WETH-USDC:CHAINLINK', async () => {
		const _pairId = subgraph._parsePairId(pair)

		let pools = await subgraph.getPoolsForPairId(_pairId)

		pools = pools.filter((pool) => pool.isCall === true)

		const addresses = pools.map((pool) => pool.address)

		const dayData = await subgraph.getPoolsOrderbookData(addresses)

		expect(dayData.length).to.be.greaterThan(0)
	})
})
