import PremiaVoidnode from '../../src/services/voidnode'
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
	voidnode: PremiaVoidnode,
	pair: TokenPairOrId
): Promise<string> {
	const _pairId = voidnode._parsePairId(pair)
	let pools = await voidnode.getPoolsForPairId(_pairId)
	return pools[0].address
}

describe('PremiaVoidnode', function (this: any) {
	this.timeout(15000)

	let voidnode: PremiaVoidnode

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
		voidnode = new PremiaVoidnode(
			'https://api.thegraph.com/voidnodes/name/premian-labs/premia-blue'
		)
	})

	describe('AnalyticsQuery', () => {
		it('#getPoolsOrderbookData', async () => {
			// WETH-USDC:CHAINLINK
			const _pairId = voidnode._parsePairId(pair)

			let pools = await voidnode.getPoolsForPairId(_pairId)

			pools = pools.filter((pool) => pool.isCall === true)

			const addresses = pools.map((pool) => pool.address)

			const dayData = await voidnode.getPoolsOrderbookData(addresses)

			expect(dayData.length).to.be.greaterThan(0)
		})
	})

	describe('PoolQuery', () => {
		it('#getPoolMinimal', async () => {
			const poolAddress = await getFirstPoolAddress(voidnode, pair)

			let pool = await voidnode.getPoolMinimal(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await voidnode.getPoolMinimal(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPool', async () => {
			const poolAddress = await getFirstPoolAddress(voidnode, pair)

			let pool = await voidnode.getPool(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await voidnode.getPool(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPoolExtended', async () => {
			const poolAddress = await getFirstPoolAddress(voidnode, pair)

			let pool = await voidnode.getPoolExtended(poolAddress)
			expect(pool).to.not.be.null
			expect(pool).to.not.be.undefined

			pool = await voidnode.getPoolExtended(fakeAddress)
			expect(pool).to.be.null
		})

		it('#getPools', async () => {
			let pools = await voidnode.getPools(pair.base.address)
			expect(pools.length).to.be.greaterThan(0)

			pools = await voidnode.getPools(fakeAddress)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsExtended', async () => {
			let pools = await voidnode.getPoolsExtended(pair.base.address)
			expect(pools.length).to.be.greaterThan(0)

			pools = await voidnode.getPoolsExtended(fakeAddress)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsForToken', async () => {
			let pools = await voidnode.getPoolsForToken(token)
			expect(pools.length).to.be.greaterThan(0)

			pools = await voidnode.getPoolsForToken(fakeToken)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsExtendedForToken', async () => {
			let pools = await voidnode.getPoolsExtendedForToken(token)
			expect(pools.length).to.be.greaterThan(0)

			pools = await voidnode.getPoolsExtendedForToken(fakeToken)
			expect(pools.length).to.be.eq(0)
		})

		it('#getPoolsForPairId', async () => {
			const _pairId = voidnode._parsePairId(pair)
			const pools = await voidnode.getPoolsForPairId(_pairId)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getPoolsForPair', async () => {
			const pools = await voidnode.getPoolsForPair(minimalPair)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getPoolsExtendedForPair', async () => {
			const pools = await voidnode.getPoolsExtendedForPair(minimalPair)

			expect(pools.length).to.be.greaterThan(0)
		})

		it('#getTicksForPool', async () => {
			const poolAddress = await getFirstPoolAddress(voidnode, pair)

			let ticks = await voidnode.getTicksForPool(poolAddress)
			expect(ticks.length).to.be.greaterThan(0)

			ticks = await voidnode.getTicksForPool(fakeAddress)
			expect(ticks.length).to.be.eq(0)
		})

		it('#getQuotePools', async () => {
			const poolAddress = await getFirstPoolAddress(voidnode, pair)

			let ticks = await voidnode.getTicksForPool(poolAddress)
			expect(ticks.length).to.be.greaterThan(0)

			ticks = await voidnode.getTicksForPool(fakeAddress)
			expect(ticks.length).to.be.eq(0)
		})
	})

	describe('TokenQuery', () => {
		it('#getToken', async () => {
			let _token = await voidnode.getToken(token.address)
			expect(_token).to.not.be.null
			expect(_token).to.not.be.undefined

			_token = await voidnode.getToken(fakeToken.address)
			expect(_token).to.be.null
		})

		it('#getTokenExtended', async () => {
			let _token = await voidnode.getTokenExtended(token.address)
			expect(_token).to.not.be.null
			expect(_token).to.not.be.undefined

			_token = await voidnode.getTokenExtended(fakeToken.address)
			expect(_token).to.be.null
		})

		it('#getTokens', async () => {
			let tokens = await voidnode.getTokens([
				pair.base.address,
				pair.quote.address,
			])
			expect(tokens.length).to.be.eq(2)

			tokens = await voidnode.getTokens([pair.base.address, fakeToken.address])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokensExtended', async () => {
			let tokens = await voidnode.getTokensExtended([
				pair.base.address,
				pair.quote.address,
			])
			expect(tokens.length).to.be.eq(2)

			tokens = await voidnode.getTokensExtended([
				pair.base.address,
				fakeToken.address,
			])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokenList', async () => {
			let tokens = await voidnode.getTokenList([pair.base, pair.quote])
			expect(tokens.length).to.be.eq(2)

			tokens = await voidnode.getTokenList([pair.base, fakeToken])
			expect(tokens.length).to.be.eq(1)
		})

		it('#getTokenListExtended', async () => {
			let tokens = await voidnode.getTokenListExtended([pair.base, pair.quote])
			expect(tokens.length).to.be.eq(2)

			tokens = await voidnode.getTokenListExtended([pair.base, fakeToken])
			expect(tokens.length).to.be.eq(1)
		})
	})

	describe('TokenPairQuery', () => {
		it('#getPair', async () => {
			const tokenPair = await voidnode.getPair(minimalPair)
			expect(tokenPair).to.not.be.null
			expect(tokenPair).to.not.be.undefined
		})

		it('#getPairExtended', async () => {
			const tokenPair = await voidnode.getPairExtended(minimalPair)
			expect(tokenPair).to.not.be.null
			expect(tokenPair).to.not.be.undefined
		})

		it('#getPairs', async () => {
			const tokenPairs = await voidnode.getPairs([minimalPair])
			expect(tokenPairs.length).to.eq(1)
		})

		it('#getPairsExtended', async () => {
			const tokenPairs = await voidnode.getPairsExtended([minimalPair])
			expect(tokenPairs.length).to.eq(1)
		})
	})

	describe('UserQuery', () => {
		it('#getUser', async () => {
			let user = await voidnode.getUser(defaultUser)
			expect(user).to.not.be.null
			expect(user).to.not.be.undefined

			user = await voidnode.getUser(fakeAddress)
			expect(user).to.be.null
		})

		it('#getUserExtended', async () => {
			let user = await voidnode.getUserExtended(defaultUser)
			expect(user).to.not.be.null
			expect(user).to.not.be.undefined

			user = await voidnode.getUserExtended(fakeAddress)
			expect(user).to.be.undefined
		})

		it('#getUsers', async () => {
			let users = await voidnode.getUsers([defaultUser])
			expect(users.length).to.eq(1)

			users = await voidnode.getUsers([defaultUser, fakeAddress])
			expect(users.length).to.eq(1)
		})

		it('#getUsersExtended', async () => {
			let users = await voidnode.getUsersExtended([defaultUser])
			expect(users.length).to.eq(1)

			users = await voidnode.getUsersExtended([defaultUser, fakeAddress])
			expect(users.length).to.eq(1)
		})

		it('#getUserSnapshots', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await voidnode.getUserSnapshots(defaultUser, 0, now)
			expect(snapshots.length).to.be.greaterThan(0)
		})

		it('#getUserSnapshotsExtended', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await voidnode.getUserSnapshotsExtended(
				defaultUser,
				0,
				now
			)
			expect(snapshots.length).to.be.greaterThan(0)
		})

		it('#getUserPortfolio', async () => {
			let portfolio = await voidnode.getUserPortfolio(defaultUser)
			expect(portfolio).to.not.be.null
			expect(portfolio).to.not.be.undefined

			portfolio = await voidnode.getUserPortfolio(fakeAddress)
			expect(portfolio).to.be.undefined
		})

		it('#getUserPortfolioExtended', async () => {
			let portfolio = await voidnode.getUserPortfolioExtended(defaultUser)
			expect(portfolio).to.not.be.null
			expect(portfolio).to.not.be.undefined

			portfolio = await voidnode.getUserPortfolioExtended(fakeAddress)
			expect(portfolio).to.be.undefined
		})

		it('#getUserSnapshot', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await voidnode.getUserSnapshots(defaultUser, 0, now)

			const snapshot = await voidnode.getUserSnapshot(
				defaultUser,
				snapshots[0].timestamp
			)

			expect(snapshot).to.not.be.null
		})

		it('#getUserSnapshotExtended', async () => {
			const now = dayjs().utcOffset(0).valueOf()
			const snapshots = await voidnode.getUserSnapshots(defaultUser, 0, now)

			let snapshot = await voidnode.getUserSnapshotExtended(
				defaultUser,
				snapshots[0].timestamp
			)

			expect(snapshot).to.not.be.null
		})
	})

	xdescribe('TransactionQuery', () => {
		it('#getTransactions', async () => {
			const transactions = await voidnode.getTransactions(
				'add',
				'TESTWETH/USDC',
				'timestamp',
				'ASC',
				10,
				0,
				'pool'
			)
			console.log(transactions)
			expect(transactions.length).to.be.greaterThan(0)
		})

		it('#getTransaction', async () => {
			const transactions = await voidnode.getTransactions(
				'add',
				'TESTWETH/USDC',
				'timestamp',
				'ASC',
				10,
				0,
				'pool'
			)
			const hash = get(transactions[0], 'id', '')

			const tx = await voidnode.getTransaction(hash)
			expect(tx).to.not.be.null
			expect(tx).to.not.be.undefined
		})
	})

	// TODO: requires similar setup to cloud apps integration test (generating on-chain events)
	xdescribe('VaultTransactionQuery', async () => {
		it('#getVaultTransactions', async () => {
			const transactions = await voidnode.getVaultTransactions(
				'add',
				'ETH',
				'timestamp',
				'ASC',
				10,
				0,
				'token'
			)
			expect(transactions.length).to.be.greaterThan(0)
		})

		it('#getVaultTransaction', async () => {
			const transactions = await voidnode.getVaultTransactions(
				'add',
				'ETH',
				'timestamp',
				'ASC',
				10,
				0,
				'token'
			)
			const hash = get(transactions[0], 'id', '')

			const tx = await voidnode.getVaultTransaction(hash)
			expect(tx).to.not.be.null
			expect(tx).to.not.be.undefined
		})
	})

	describe('OptionPositionQuery', async () => {
		it('#getOptionPositionsExtendedForUser', async () => {
			let owner = '0x9e600587b9035a8c1254e8256f4e588cc33b8467'
			let positions = await voidnode.getOptionPositionsExtendedForUser(owner)

			expect(positions.length).to.be.greaterThan(0)
		})
	})

	describe('LiquidityPositionQuery', async () => {
		it('#getLiquidityPositionsExtendedForUser', async () => {
			let owner = '0x9e600587b9035a8c1254e8256f4e588cc33b8467'
			let positions = await voidnode.getLiquidityPositionsExtendedForUser(owner)

			expect(positions.length).to.be.greaterThan(0)

			positions = await voidnode.getLiquidityPositionsExtendedForUser(
				owner,
				OrderType.LONG_COLLATERAL
			)

			expect(positions.length).to.be.greaterThan(0)
			expect(positions[0].orderType).to.eq('LONG_COLLATERAL')

			positions = await voidnode.getLiquidityPositionsExtendedForUser(
				owner,
				OrderType.COLLATERAL_SHORT
			)

			expect(positions.length).to.be.greaterThan(0)
			expect(positions[0].orderType).to.eq('COLLATERAL_SHORT')
		})
	})

	describe('VaultQuery', async () => {
		it('#getAllVaultsExtended', async () => {
			const vaults = await voidnode.getAllVaultsExtended()

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVault', async () => {
			const vaults = await voidnode.getAllVaultsExtended()
			const vaultAddress = vaults[0].address
			const vault = await voidnode.getVault(vaultAddress)

			expect(vault).to.not.be.null
			expect(vault).to.not.be.undefined
		})

		it('#getVaultExtended', async () => {
			const vaults = await voidnode.getAllVaultsExtended()
			const vaultAddress = vaults[0].address
			const vault = await voidnode.getVaultExtended(vaultAddress)

			expect(vault).to.not.be.null
			expect(vault).to.not.be.undefined
		})

		it('#getVaults', async () => {
			const tokenAddress = Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH
			const vaults = await voidnode.getVaults(tokenAddress)

			expect(vaults.length).to.be.greaterThan(0)
		})

		it('#getVaultsExtended', async () => {
			const tokenAddress = Addresses[SupportedChainId.ARBITRUM_GOERLI].TEST_WETH
			const vaults = await voidnode.getVaultsExtended(tokenAddress)

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
			const vaults = await voidnode.getVaultsForToken(token)

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
			const vaults = await voidnode.getVaultsExtendedForToken(token)

			expect(vaults.length).to.be.greaterThan(0)
		})
	})
})
