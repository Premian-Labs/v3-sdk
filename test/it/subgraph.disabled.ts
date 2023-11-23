import PremiaSubgraph from '../../src/services/subgraph'
import {
	Addresses,
	OrderType,
	SupportedChainId,
	Token,
	TokenPairMinimal,
	TokenPairOrId,
	TokenPairQuery,
} from '../../src'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { get } from 'lodash'

async function getFirstPoolAddress(
	subgraph: PremiaSubgraph,
	pair: TokenPairOrId
): Promise<string> {
	const _pairId = subgraph._parsePairId(pair)
	let pools = await subgraph.getPoolsForPairId(_pairId)
	return pools[0].address
}

describe('PremiaSubgraph', function (this: any) {
	this.timeout(15000)

	let subgraph: PremiaSubgraph

	const fakeAddress = '0x04Ab08f3F0dec1021930C649760158c4e02589B2'
	const defaultUser = '0x252f5ef0771ebb83a7efd51644c0dc16b1e429f6'

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
	const minimalPair: TokenPairMinimal = {
		base: {
			address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
			symbol: 'testWETH',
			decimals: 18,
		},
		quote: {
			address: Addresses[SupportedChainId.ARBITRUM_GOERLI].USDC,
			symbol: 'USDC',
			decimals: 6,
		},
		priceOracleAddress:
			Addresses[SupportedChainId.ARBITRUM_GOERLI].CHAINLINK_ORACLE_ADAPTER,
		name: 'Fake WETH Chainlink / USDC Chainlink',
	}

	// const wbtcMinimalPair: TokenPairMinimal = {
	// 	base: {
	// 		address: Addresses[SupportedChainId.ARBITRUM_GOERLI].WBTC,
	// 		symbol: 'WBTC',
	// 		decimals: 18,
	// 	},
	// 	quote: {
	// 		address: Addresses[SupportedChainId.ARBITRUM_GOERLI].USDC,
	// 		symbol: 'USDC',
	// 		decimals: 6,
	// 	},
	// 	priceOracleAddress:
	// 		Addresses[SupportedChainId.ARBITRUM_GOERLI].CHAINLINK_ORACLE_ADAPTER,
	// 	name: 'WBTC Chainlink / USDC Chainlink',
	// }

	const token: Token = {
		chainId: SupportedChainId.ARBITRUM_GOERLI,
		address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
		name: '(Mintable Fake) Wrapped Ether',
		symbol: 'testWETH',
		decimals: 18,
		isNative: false,
		isWrappedNative: false,
	}
	const fakeToken: Token = {
		chainId: SupportedChainId.ARBITRUM_GOERLI,
		address: fakeAddress,
		name: '(Mintable Fake) Faked Wrapped Ether',
		symbol: 'fakeWETH',
		decimals: 18,
		isNative: false,
		isWrappedNative: false,
	}

	beforeEach(async () => {
		subgraph = new PremiaSubgraph(
			'https://api.thegraph.com/subgraphs/name/premian-labs/premia-blue'
		)
	})

	describe('AnalyticsQuery', () => {
		it('#getPoolsOrderbookData', async () => {
			// WETH-USDC:CHAINLINK
			const _pairId = subgraph._parsePairId(pair)

			let pools = await subgraph.getPoolsForPairId(_pairId)

			pools = pools.filter((pool) => pool.isCall === true)

			const addresses = pools.map((pool) => pool.address)

			const dayData = await subgraph.getPoolsOrderbookData(addresses)

			expect(dayData.length).to.be.greaterThan(0)
		})
	})

	describe('PoolQuery', () => {
		it('#getPoolMinimal', async () => {
			const poolAddress = await getFirstPoolAddress(subgraph, pair)

			let pool = await subgraph.getPoolMinimal(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await subgraph.getPoolMinimal(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPool', async () => {
			const poolAddress = await getFirstPoolAddress(subgraph, pair)

			let pool = await subgraph.getPool(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await subgraph.getPool(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPoolExtended', async () => {
			const poolAddress = await getFirstPoolAddress(subgraph, pair)

			let pool = await subgraph.getPoolExtended(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await subgraph.getPoolExtended(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPools', async () => {
			let pools = await subgraph.getPools(pair.base.address)
			expect(pools.length).to.be.greaterThan(0)

			pools = await subgraph.getPools(fakeAddress)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsExtended', async () => {
			let pools = await subgraph.getPoolsExtended(pair.base.address)
			expect(pools.length).to.be.greaterThan(0)

			pools = await subgraph.getPoolsExtended(fakeAddress)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsForToken', async () => {
			let pools = await subgraph.getPoolsForToken(token)
			expect(pools.length).to.be.greaterThan(0)

			pools = await subgraph.getPoolsForToken(fakeToken)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsExtendedForToken', async () => {
			let pools = await subgraph.getPoolsExtendedForToken(token)
			expect(pools.length).to.be.greaterThan(0)

			pools = await subgraph.getPoolsExtendedForToken(fakeToken)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsForPairId', async () => {
			const _pairId = subgraph._parsePairId(pair)
			const pools = await subgraph.getPoolsForPairId(_pairId)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getPoolsForPair', async () => {
			const pools = await subgraph.getPoolsForPair(minimalPair)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getPoolsExtendedForPair', async () => {
			const pools = await subgraph.getPoolsExtendedForPair(minimalPair)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getTicksForPool', async () => {
			const poolAddress = await getFirstPoolAddress(subgraph, pair)

			let ticks = await subgraph.getTicksForPool(poolAddress)
			expect(ticks.length).to.be.greaterThan(0)

			ticks = await subgraph.getTicksForPool(fakeAddress)
			expect(ticks.length).to.be.eq(0)
		})

		it('#getQuotePools', async () => {
			const poolAddress = await getFirstPoolAddress(subgraph, pair)

			let ticks = await subgraph.getTicksForPool(poolAddress)
			expect(ticks.length).to.be.greaterThan(0)

			ticks = await subgraph.getTicksForPool(fakeAddress)
			expect(ticks.length).to.be.eq(0)
		})
	})

	describe('TokenQuery', () => {
		it('#getToken', async () => {
			let _token = await subgraph.getToken(token.address)
			expect(_token).to.not.be.null
			expect(_token).to.not.be.undefined

			_token = await subgraph.getToken(fakeToken.address)
			expect(_token).to.be.null
		})

		it('#getTokenExtended', async () => {
			let _token = await subgraph.getTokenExtended(token.address)
			expect(_token).to.not.be.null
			expect(_token).to.not.be.undefined

			_token = await subgraph.getTokenExtended(fakeToken.address)
			expect(_token).to.be.null
		})

		it('#getTokens', async () => {
			let tokens = await subgraph.getTokens([
				pair.base.address,
				pair.quote.address,
			])
			expect(tokens.length).to.be.eq(2)

			tokens = await subgraph.getTokens([pair.base.address, fakeToken.address])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokensExtended', async () => {
			let tokens = await subgraph.getTokensExtended([
				pair.base.address,
				pair.quote.address,
			])
			expect(tokens.length).to.be.eq(2)

			tokens = await subgraph.getTokensExtended([
				pair.base.address,
				fakeToken.address,
			])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokenList', async () => {
			let tokens = await subgraph.getTokenList([pair.base, pair.quote])
			expect(tokens.length).to.be.eq(2)

			tokens = await subgraph.getTokenList([pair.base, fakeToken])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokenListExtended', async () => {
			let tokens = await subgraph.getTokenListExtended([pair.base, pair.quote])
			expect(tokens.length).to.be.eq(2)

			tokens = await subgraph.getTokenListExtended([pair.base, fakeToken])
			expect(tokens.length).to.be.eq(1)
		})
	})

	describe('TokenPairQuery', () => {
		it('#getPair', async () => {
			const tokenPair = await subgraph.getPair(minimalPair)
			expect(tokenPair).to.not.be.null
			expect(tokenPair).to.not.be.undefined
		})

		it('#getPairExtended', async () => {
			const tokenPair = await subgraph.getPairExtended(minimalPair)
			expect(tokenPair).to.not.be.null
			expect(tokenPair).to.not.be.undefined
		})

		it('#getPairs', async () => {
			const tokenPairs = await subgraph.getPairs([minimalPair])
			expect(tokenPairs.length).to.eq(1)
		})

		it('#getPairsExtended', async () => {
			const tokenPairs = await subgraph.getPairsExtended([minimalPair])
			expect(tokenPairs.length).to.eq(1)
		})
	})

	describe('UserQuery', () => {
		it('#getUser', async () => {
			let user = await subgraph.getUser(defaultUser)
			expect(user).to.not.be.null
			expect(user).to.not.be.undefined

			user = await subgraph.getUser(fakeAddress)
			expect(user).to.be.null
		})

		it('#getUserExtended', async () => {
			let user = await subgraph.getUserExtended(defaultUser)
			expect(user).to.not.be.null
			expect(user).to.not.be.undefined

			user = await subgraph.getUserExtended(fakeAddress)
			expect(user).to.be.undefined
		})

		it('#getUsers', async () => {
			let users = await subgraph.getUsers([defaultUser])
			expect(users.length).to.eq(1)

			users = await subgraph.getUsers([defaultUser, fakeAddress])
			expect(users.length).to.eq(1)
		})

		it('#getUsersExtended', async () => {
			let users = await subgraph.getUsersExtended([defaultUser])
			expect(users.length).to.eq(1)

			users = await subgraph.getUsersExtended([defaultUser, fakeAddress])
			expect(users.length).to.eq(1)
		})

		it('#getUserSnapshots', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await subgraph.getUserSnapshots(defaultUser, 0, now)
			expect(snapshots.length).to.be.greaterThan(0)
		})

		it('#getUserSnapshotsExtended', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await subgraph.getUserSnapshotsExtended(
				defaultUser,
				0,
				now
			)
			expect(snapshots.length).to.be.greaterThan(0)
		})

		it('#getUserPortfolio', async () => {
			let portfolio = await subgraph.getUserPortfolio(defaultUser)
			expect(portfolio).to.not.be.null
			expect(portfolio).to.not.be.undefined

			portfolio = await subgraph.getUserPortfolio(fakeAddress)
			expect(portfolio).to.be.undefined
		})

		it('#getUserPortfolioExtended', async () => {
			let portfolio = await subgraph.getUserPortfolioExtended(defaultUser)
			expect(portfolio).to.not.be.null
			expect(portfolio).to.not.be.undefined

			portfolio = await subgraph.getUserPortfolioExtended(fakeAddress)
			expect(portfolio).to.be.undefined
		})

		it('#getUserSnapshot', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await subgraph.getUserSnapshots(defaultUser, 0, now)

			const snapshot = await subgraph.getUserSnapshot(
				defaultUser,
				snapshots[0].timestamp
			)

			expect(snapshot).to.not.be.null
		})

		it('#getUserSnapshotExtended', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await subgraph.getUserSnapshots(defaultUser, 0, now)

			let snapshot = await subgraph.getUserSnapshotExtended(
				defaultUser,
				snapshots[0].timestamp
			)

			expect(snapshot).to.not.be.null
		})
	})

	xdescribe('TransactionQuery', () => {
		it('#getTransactions', async () => {
			const transactions = await subgraph.getTransactions(
				'add',
				'TESTWETH/USDC',
				'timestamp',
				'asc',
				10,
				0,
				'pool'
			)
			console.log(transactions)
			expect(transactions.length).to.be.greaterThan(0)
		})

		it('#getTransaction', async () => {
			const transactions = await subgraph.getTransactions(
				'add',
				'TESTWETH/USDC',
				'timestamp',
				'asc',
				10,
				0,
				'pool'
			)
			const hash = get(transactions[0], 'id', '')

			const tx = await subgraph.getTransaction(hash)
			expect(tx).to.not.be.null
			expect(tx).to.not.be.undefined
		})
	})

	// TODO: requires similar setup to cloud apps integration test (generating on-chain events)
	xdescribe('VaultTransactionQuery', async () => {
		it('#getVaultTransactions', async () => {
			const transactions = await subgraph.getVaultTransactions(
				'add',
				'ETH',
				'timestamp',
				'asc',
				10,
				0,
				'token'
			)
			expect(transactions.length).to.be.greaterThan(0)
		})

		it('#getVaultTransaction', async () => {
			const transactions = await subgraph.getVaultTransactions(
				'add',
				'ETH',
				'timestamp',
				'asc',
				10,
				0,
				'token'
			)
			const hash = get(transactions[0], 'id', '')

			const tx = await subgraph.getVaultTransaction(hash)
			expect(tx).to.not.be.null
			expect(tx).to.not.be.undefined
		})
	})

	describe('OptionPositionQuery', async () => {
		it('#getOptionPositionsExtendedForUser', async () => {
			let owner = '0x9e600587b9035a8c1254e8256f4e588cc33b8467'
			let positions = await subgraph.getOptionPositionsExtendedForUser(owner)

			expect(positions.length).to.be.greaterThan(0)
		})
	})

	describe('LiquidityPositionQuery', async () => {
		it('#getLiquidityPositionsExtendedForUser', async () => {
			let owner = '0x9e600587b9035a8c1254e8256f4e588cc33b8467'
			let positions = await subgraph.getLiquidityPositionsExtendedForUser(owner)

			expect(positions.length).to.be.greaterThan(0)

			positions = await subgraph.getLiquidityPositionsExtendedForUser(
				owner,
				OrderType.LONG_COLLATERAL
			)

			expect(positions.length).to.be.greaterThan(0)
			expect(positions[0].orderType).to.eq('LONG_COLLATERAL')

			positions = await subgraph.getLiquidityPositionsExtendedForUser(
				owner,
				OrderType.COLLATERAL_SHORT
			)

			expect(positions.length).to.be.greaterThan(0)
			expect(positions[0].orderType).to.eq('COLLATERAL_SHORT')
		})
	})

	describe('VaultQuery', async () => {
		it('#getAllVaultsExtended', async () => {
			const vaults = await subgraph.getAllVaultsExtended()

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVault', async () => {
			const vaults = await subgraph.getAllVaultsExtended()
			const vaultAddress = vaults[0].address
			const vault = await subgraph.getVault(vaultAddress)

			expect(vault).to.not.be.null
			expect(vault).to.not.be.undefined
		})

		it('#getVaultExtended', async () => {
			const vaults = await subgraph.getAllVaultsExtended()
			const vaultAddress = vaults[0].address
			const vault = await subgraph.getVaultExtended(vaultAddress)

			expect(vault).to.not.be.null
			expect(vault).to.not.be.undefined
		})

		it('#getVaults', async () => {
			const tokenAddress = Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH
			const vaults = await subgraph.getVaults(tokenAddress)

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVaultsExtended', async () => {
			const tokenAddress = Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH
			const vaults = await subgraph.getVaultsExtended(tokenAddress)

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVaultsForToken', async () => {
			const token: Token = {
				chainId: SupportedChainId.ARBITRUM_GOERLI,
				address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
				name: '(Mintable Fake) Wrapped Ether',
				symbol: 'testWETH',
				decimals: 18,
				isNative: false,
				isWrappedNative: false,
			}
			const vaults = await subgraph.getVaultsForToken(token)

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVaultsExtendedForToken', async () => {
			const token: Token = {
				chainId: SupportedChainId.ARBITRUM_GOERLI,
				address: Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH,
				name: '(Mintable Fake) Wrapped Ether',
				symbol: 'testWETH',
				decimals: 18,
				isNative: false,
				isWrappedNative: false,
			}
			const vaults = await subgraph.getVaultsExtendedForToken(token)

			expect(vaults.length).to.be.greaterThan(0)
		})
	})
})
