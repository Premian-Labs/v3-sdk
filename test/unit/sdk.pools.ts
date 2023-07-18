import { JsonRpcProvider, parseEther, toBigInt } from 'ethers'
import { expect } from 'chai'
import {
	Addresses,
	OrderType,
	PositionKey,
	Premia,
	TokenPairOrId,
	WAD_BI,
} from '../../src'
import { SupportedChainId } from '../../src/constants'
import PremiaSubgraph from '../../src/services/subgraph'

async function getFirstPoolAddress(
	subgraph: PremiaSubgraph,
	pair: TokenPairOrId
): Promise<string> {
	const _pairId = subgraph._parsePairId(pair)
	let pools = await subgraph.getPoolsForPairId(_pairId)
	return pools[0].address
}

describe('Pools API', function (this: any) {
	let premia: Premia
	let signerAddress: string
	let positionKey: PositionKey
	let provider = new JsonRpcProvider('http://127.0.0.1:8545')
	let snapshotId: any

	const pair: TokenPairOrId = {
		base: {
			chainId: SupportedChainId.ARBITRUM_GOERLI,
			address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
			name: '(Mintable Fake) Wrapped Ether',
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
		name: 'Fake WETH Chainlink / USDC Chainlink',
		tags: ['native', 'stablecoin'],
	}

	this.timeout(30000)

	beforeEach(async () => {
		premia = await Premia.initialize({
			provider: 'http://127.0.0.1:8545',
			chainId: SupportedChainId.ARBITRUM_GOERLI,
		})

		signerAddress = await premia.signer!.getAddress()

		positionKey = {
			isCall: true,
			orderType: OrderType.LONG_COLLATERAL,
			strike: parseEther('2100'),
			lower: parseEther('0.1'),
			upper: parseEther('0.2'),
			owner: '0x02aab9c1ee2610c7c521902aead2806c70e3033e',
			operator: '0x02aab9c1ee2610c7c521902aead2806c70e3033e',
		}

		snapshotId = await provider.send('evm_snapshot', [])
	})

	afterEach(async () => {
		await provider.send('evm_revert', [snapshotId])
	})

	it('#getBreakevenPrice', async () => {
		const strike = parseEther('2000')
		const spotPrice = parseEther('1800')
		const marketPrice = parseEther('0.2')

		const breakevenCall = premia.pools.getBreakevenPrice(
			strike,
			true,
			marketPrice,
			spotPrice
		)

		const marketPriceInSpot = (marketPrice * spotPrice) / WAD_BI

		expect(breakevenCall).to.be.equal(
			(spotPrice * toBigInt(strike)) / (spotPrice - marketPriceInSpot)
		)

		const breakevenPut = premia.pools.getBreakevenPrice(
			strike,
			false,
			marketPrice,
			spotPrice
		)

		const marketPriceInStrike = (marketPrice * toBigInt(strike)) / WAD_BI

		expect(breakevenPut).to.be.equal(toBigInt(strike) - marketPriceInStrike)
	})

	it('#getTokenId', async () => {
		const tokenId = await premia.pools.getTokenId(positionKey)

		expect(tokenId).to.be.equal(
			toBigInt(
				'7237005577332262213976267518998401887003747574026652252440431069178305388644'
			)
		)
	})

	it('#getStrandedArea', async () => {
		const poolAddress = '0x06973ac31ca63fd719b9a5d5970e4ad87c47b5c2'

		const strandedArea = await premia.pools.getStrandedArea(poolAddress)

		expect(strandedArea.lower).to.not.equal(strandedArea.upper)
	})

	it('#isMarketPriceStranded', async () => {
		const poolAddress = '0x06973ac31ca63fd719b9a5d5970e4ad87c47b5c2'
		const isStranded = await premia.pools.isMarketPriceStranded(poolAddress)

		expect(isStranded).to.be.equal(false)
	})

	it('#marketPrice', async () => {
		const poolAddress = '0x06973ac31ca63fd719b9a5d5970e4ad87c47b5c2'
		const price = await premia.pools.marketPrice(poolAddress)

		expect(price).to.not.undefined
	})
})
