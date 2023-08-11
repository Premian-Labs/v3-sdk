import fetch from 'cross-fetch'

import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
} from '@apollo/client/core'

import {
	LiquidityPositionExtended,
	OptionPositionExtended,
	OptionType,
	OrderType,
	Pool,
	PoolDayData,
	PoolExtended,
	PoolMinimal,
	Referral,
	StakeHistory,
	Tick,
	Token,
	TokenExtended,
	TokenPair,
	TokenPairExtended,
	TokenPairMinimal,
	Transaction,
	User,
	UserExtended,
	UserPortfolio,
	UserPortfolioExtended,
	UserSnapshot,
	UserSnapshotExtended,
	UserStake,
	Vault,
	VaultDayData,
	VaultExtended,
	VaultPosition,
	VaultPositionExtended,
	VaultTransaction,
	VaultVote,
	VoteHistory,
} from '../../entities'

import { DefaultApolloClientOptions } from '../../constants'
import { QueryParams } from '../../utils'
import {
	AnalyticsQuery,
	LiquidityPositionQuery,
	OptionPositionQuery,
	PoolQuery,
	TickQuery,
	TokenPairQuery,
	TokenQuery,
	TransactionQuery,
	UserQuery,
	VaultPositionQuery,
	VaultQuery,
	VaultTransactionQuery,
	VxPremiaQuery,
	ReferralQuery,
} from './graphql'

import { BigNumberish, toBigInt } from 'ethers'
import { get } from 'lodash'
import { TokenInfo } from '@premia/pair-lists/src/types'
import { TokenPairOrId, TokenPairOrInfo } from '../../api'

/**
 * The PremiaSubgraph class is the entry point for interacting with the Premia V3 subgraph
 * to query on-chain and indexed data using various APIs and services

 *
 * @public @alpha
 */
export class PremiaSubgraph {
	/**
	 * The subgraph URL to use for fetching indexed contract data.
	 */
	uri: string

	/**
	 * The apollo subgraph client used to fetch data from the Premia subgraph.
	 *
	 * @defaultValue {@link ApolloClient}
	 */
	client: ApolloClient<NormalizedCacheObject>

	/**
	 * The subgraph-specific parameters to be used for upcoming subgraph queries.
	 *
	 * @defaultValue `{}` (empty object)
	 */
	queryParams?: QueryParams

	/**
	 * Creates a new Premia V3 SDK instance.
	 *
	 * @remarks
	 * The SDK needs to be initialized before it can be used with
	 * non-default parameters.
	 */
	constructor(uri: string) {
		this.uri =
			uri ?? 'https://api.thegraph.com/subgraphs/name/premiafinance/v3-goerli'
		this.client = new ApolloClient({
			link: new HttpLink({ uri: this.uri, fetch }),
			cache: new InMemoryCache(),
			defaultOptions: DefaultApolloClientOptions,
		})
	}

	setQueryParams(queryParams: QueryParams) {
		if (!this.queryParams) {
			this.queryParams = queryParams
		} else {
			this.queryParams.additionalFields =
				queryParams.additionalFields ?? this.queryParams.additionalFields
		}
	}

	async getVaultDayData(
		vaultAddress: string,
		startTime = 0,
		first: number = 1000,
		skip: number = 0
	): Promise<VaultDayData[]> {
		const response = await this.client.query({
			query: AnalyticsQuery.GetVaultDayData(
				this,
				vaultAddress,
				startTime,
				first,
				skip
			),
		})
		return get(response, 'data.vaultDayDatas', []) as VaultDayData[]
	}

	async getPoolsOrderbookData(addresses: string[]): Promise<PoolDayData[]> {
		const response = await this.client.query({
			query: AnalyticsQuery.GetPoolsOrderbookData(this, addresses),
		})
		return get(response, 'data.poolDayDatas', []) as PoolDayData[]
	}

	async getPoolMinimal(address: string): Promise<PoolMinimal> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolMinimal(this, address),
		})

		if (!response.data) {
			throw new Error(
				'Pool not found. If this pool has not yet been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pool') as PoolMinimal
	}

	async getPool(address: string): Promise<Pool> {
		const response = await this.client.query({
			query: PoolQuery.GetPool(this, address),
		})

		if (!response.data) {
			throw new Error(
				'Pool not found. If this pool has not yet been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pool') as Pool
	}

	async getPoolExtended(address: string): Promise<PoolExtended> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolExtended(this, address),
		})

		if (!response.data) {
			throw new Error(
				'Pool not found. If this pool has not yet been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pool') as PoolExtended
	}

	async getPools(baseAddress: string): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPools(this, baseAddress),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []) as Pool[]
	}

	async getPoolsExtended(baseAddress: string): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsExtended(this, baseAddress),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
	}

	async getAllPools(): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetAllPools(this),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []) as Pool[]
	}

	async getAllPoolsExtended(): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetAllPoolsExtended(this),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
	}

	async getPoolsForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsForToken(this, token, isQuote),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as Pool
		) as Pool[]
	}

	async getPoolsExtendedForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsExtendedForToken(this, token, isQuote),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
	}

	async getPoolsForPairId(id: string): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsForPairId(this, id),
		})
		return get(response, 'data.pools', []) as Pool[]
	}

	async getPoolsForPair(pair: TokenPairMinimal): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsForPair(this, pair),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []) as Pool[]
	}

	async getPoolsExtendedForPair(
		pair: TokenPairMinimal,
		options?: {
			strike?: BigNumberish
			maturity?: BigNumberish
		}
	): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsExtendedForPair(this, pair),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		return get(response, 'data.pools', []).filter(
			(pool: PoolExtended) =>
				(!options ||
					!options.strike ||
					String(pool.strike) === String(options.strike)) &&
				(!options ||
					!options.maturity ||
					String(pool.maturity) === String(options.maturity))
		) as PoolExtended[]
	}

	async getTicksForPool(poolAddress: string): Promise<Tick[]> {
		const response = await this.client.query({
			query: PoolQuery.GetTicks(this, poolAddress),
		})

		if (!get(response, 'data.ticks')) {
			throw new Error(
				'Ticks not found. If pool has not been initialized, use the `deployPool` method first.'
			)
		}
		return get(response, 'data.ticks', []) as Tick[]
	}

	async getQuotePools(
		tokenAddress: string,
		strike: BigNumberish,
		maturity: BigNumberish,
		isCall: boolean
	): Promise<PoolMinimal[]> {
		const response = await this.client.query({
			query: PoolQuery.GetQuotePools(
				this,
				tokenAddress,
				strike.toString(),
				maturity.toString(),
				isCall ? OptionType.CALL : OptionType.PUT
			),
		})
		return get(response, 'data.pools', []) as PoolMinimal[]
	}

	async getTick(normalizedPrice: BigNumberish, poolAddress: string) {
		const response = await this.client.query({
			query: TickQuery.GetTick(this, normalizedPrice, poolAddress),
		})

		if (!get(response, 'data.tick')) {
			throw new Error(
				'Tick not found. If pool has been initialized, use the `deployPool` method first.'
			)
		}
		return get(response, 'data.tick', null) as Tick
	}

	async spotPrice(address: string): Promise<bigint> {
		const token = await this.getToken(address)

		if (!token.priceUSD) {
			throw new Error(`Token price not found for token: ${address}`)
		}

		return toBigInt(token.priceUSD)
	}

	async getToken(address: string): Promise<Token> {
		const response = await this.client.query({
			query: TokenQuery.GetToken(this, address),
		})
		return get(response, 'data.token') as Token
	}

	async getTokenExtended(address: string): Promise<TokenExtended> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenExtended(this, address),
		})
		return get(response, 'data.token') as TokenExtended
	}

	async getTokens(tokens: string[]): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokens(this, tokens),
		})
		return get(response, 'data.tokens') as Token[]
	}

	async getTokensExtended(tokens: string[]): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokensExtended(this, tokens),
		})
		return get(response, 'data.tokens') as TokenExtended[]
	}

	async getAllTokens(): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetAllTokens(this),
		})
		return get(response, 'data.tokens') as Token[]
	}

	async getAllTokensExtended(): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetAllTokensExtended(this),
		})
		return get(response, 'data.tokens') as TokenExtended[]
	}

	async getTokenList(tokenList: TokenInfo[]): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenList(this, tokenList),
		})
		return get(response, 'data.tokens') as Token[]
	}

	async getTokenListExtended(tokenList: TokenInfo[]): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenListExtended(this, tokenList),
		})
		return get(response, 'data.tokens') as TokenExtended[]
	}

	_parsePairId(pair: TokenPairOrId): string {
		let _pairId: string
		if (get(pair, 'base')) {
			_pairId = TokenPairQuery.pairId(
				(pair as TokenPair).base.address,
				(pair as TokenPair).quote.address,
				(pair as TokenPair).priceOracleAddress
			)
		} else {
			_pairId = pair as string
		}

		return _pairId
	}

	_parsePair(pair: TokenPairOrId): {
		quote: string
		base: string
		priceOracleAddress: string
	} {
		let _pair: { quote: string; base: string; priceOracleAddress: string }
		if (get(pair, 'base')) {
			_pair = {
				base: (pair as TokenPair).base.address,
				quote: (pair as TokenPair).quote.address,
				priceOracleAddress: (pair as TokenPair).priceOracleAddress,
			}
		} else {
			_pair = {
				base: (pair as string).split('/')[0],
				quote: (pair as string).split('/')[1].split(':')[0],
				priceOracleAddress: (pair as string).split(':')[1],
			}
		}

		return _pair
	}

	async getPair(pair: TokenPairOrInfo): Promise<TokenPair> {
		const pairId = this._parsePairId(pair)
		const response = await this.client.query({
			query: TokenPairQuery.GetPair(this, pairId),
		})

		const tokenPair = get(response, 'data.tokenPair') as TokenPair

		if (!tokenPair.base || !tokenPair.quote) {
			throw new Error('Invalid pair. Pair was not found on subgraph.')
		}

		return tokenPair
	}

	async getPairExtended(pair: TokenPairOrId): Promise<TokenPairExtended> {
		const pairId = this._parsePairId(pair)
		const response = await this.client.query({
			query: TokenPairQuery.GetPairExtended(this, pairId),
		})
		const tokenPair = get(response, 'data.tokenPair') as TokenPairExtended

		if (!tokenPair.base || !tokenPair.quote) {
			throw new Error('Invalid pair. Pair was not found on subgraph.')
		}

		return tokenPair
	}

	async getPairs(pairs: TokenPairOrId[]): Promise<TokenPair[]> {
		const pairIds = pairs.map((pair) => this._parsePairId(pair))
		const response = await this.client.query({
			query: TokenPairQuery.GetPairs(this, pairIds),
		})
		return get(response, 'data.tokenPairs') as TokenPair[]
	}

	async getPairsExtended(pairs: TokenPairOrId[]): Promise<TokenPairExtended[]> {
		const _pairIds = pairs.map((pair) => this._parsePairId(pair))
		const response = await this.client.query({
			query: TokenPairQuery.GetPairsExtended(this, _pairIds),
		})

		return get(response, 'data.tokenPairs') as TokenPairExtended[]
	}

	async getAllPairs(): Promise<TokenPair[]> {
		const response = await this.client.query({
			query: TokenPairQuery.GetAllPairs(this),
		})
		return get(response, 'data.tokenPairs') as TokenPair[]
	}

	async getAllPairsExtended(): Promise<TokenPairExtended[]> {
		const response = await this.client.query({
			query: TokenPairQuery.GetAllPairsExtended(this),
		})

		return get(response, 'data.tokenPairs') as TokenPairExtended[]
	}

	async getTransaction(hash: string): Promise<Transaction> {
		const response = await this.client.query({
			query: TransactionQuery.GetTransaction(this, hash),
		})
		return get(response, 'data.transaction') as Transaction
	}

	async getTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first: number = 100,
		skip: number = 0,
		type?: string,
		poolAddress?: string,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<Transaction[]> {
		const response = await this.client.query({
			query: TransactionQuery.GetTransactions(
				this,
				filter,
				search,
				orderBy,
				order,
				first,
				skip,
				type,
				poolAddress,
				account,
				startTime,
				endTime,
				searchInput
			),
		})

		return get(response, 'data.transactions') as Transaction[]
	}

	async getVaultTransaction(hash: string): Promise<VaultTransaction> {
		const response = await this.client.query({
			query: VaultTransactionQuery.GetVaultTransaction(this, hash),
		})
		return get(response, 'data.vaultTransaction') as VaultTransaction
	}

	async getVaultTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first: number = 100,
		skip: number = 0,
		type?: string,
		vaultAddress?: string,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<VaultTransaction[]> {
		const response = await this.client.query({
			query: VaultTransactionQuery.GetVaultTransactions(
				this,
				filter,
				search,
				orderBy,
				order,
				first,
				skip,
				type,
				vaultAddress,
				account,
				startTime,
				endTime,
				searchInput
			),
		})
		return get(response, 'data.vaultTransactions') as VaultTransaction[]
	}

	async getUser(address: string): Promise<User> {
		const response = await this.client.query({
			query: UserQuery.GetUser(this, address),
		})
		return get(response, 'data.user') as User
	}

	async getUserExtended(address: string): Promise<UserExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserExtended(this, address),
		})
		return get(response, 'data.user') as UserExtended
	}

	async getUsers(addresses: string[]): Promise<User[]> {
		const response = await this.client.query({
			query: UserQuery.GetUsers(this, addresses),
		})
		return get(response, 'data.users', []) as User[]
	}

	async getUsersExtended(addresses: string[]): Promise<UserExtended[]> {
		const response = await this.client.query({
			query: UserQuery.GetUsersExtended(this, addresses),
		})
		return get(response, 'data.users', []) as UserExtended[]
	}

	async getUserSnapshot(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshot> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshot(this, address, timestamp),
		})
		return get(response, 'data.userSnapshot') as UserSnapshot
	}

	async getUserSnapshotExtended(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshotExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshotExtended(this, address, timestamp),
		})
		return get(response, 'data.userSnapshot') as UserSnapshotExtended
	}

	async getUserSnapshots(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first: number = 100,
		skip: number = 0
	): Promise<UserSnapshot[]> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshots(
				this,
				address,
				startTime,
				endTime,
				orderBy,
				order,
				first,
				skip
			),
		})
		return get(response, 'data.userSnapshots', []) as UserSnapshot[]
	}

	async getUserSnapshotsExtended(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first: number = 100,
		skip: number = 0
	): Promise<UserSnapshotExtended[]> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshotsExtended(
				address,
				startTime,
				endTime,
				orderBy,
				order,
				first,
				skip
			),
		})
		return get(response, 'data.userSnapshots', []) as UserSnapshotExtended[]
	}

	async getUserPortfolio(address: string): Promise<UserPortfolio> {
		const response = await this.client.query({
			query: UserQuery.GetUserPortfolio(this, address),
		})
		return get(response, 'data.user') as UserPortfolio
	}

	async getUserPortfolioExtended(
		address: string
	): Promise<UserPortfolioExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserPortfolioExtended(this, address),
		})
		return get(response, 'data.user') as UserPortfolioExtended
	}

	tradeSide(isBuy: boolean): bigint {
		return isBuy ? 0n : 1n
	}

	optionType(isCall: boolean): bigint {
		return isCall ? 0n : 1n
	}

	async getVault(address: string): Promise<Vault> {
		const response = await this.client.query({
			query: VaultQuery.GetVault(this, address),
		})
		return get(response, 'data.vault', null) as Vault
	}

	async getVaultExtended(address: string): Promise<VaultExtended> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultExtended(this, address),
		})
		return get(response, 'data.vault', null) as VaultExtended
	}

	async getAllVaultsExtended(): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetAllVaultsExtended(this),
		})
		return get(response, 'data.vaults', []) as VaultExtended[]
	}

	async getVaults(baseAddress: string): Promise<Vault[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaults(this, baseAddress),
		})
		return get(response, 'data.vaults', []) as Vault[]
	}

	async getVaultsExtended(baseAddress: string): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsExtended(this, baseAddress),
		})
		return get(response, 'data.vaults', []) as VaultExtended[]
	}

	async getVaultsForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<Vault[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsForToken(this, token),
		})
		return get(response, 'data.vaults', []) as Vault[]
	}

	async getVaultsExtendedForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsExtendedForToken(this, token),
		})
		return get(response, 'data.vaults', []) as VaultExtended[]
	}

	async getVaultPositionsExtendedForUser(
		owner: string
	): Promise<VaultPositionExtended[]> {
		const response = await this.client.query({
			query: VaultPositionQuery.GetVaultPositionsExtendedForUser(this, owner),
		})
		return get(response, 'data.vaultPositions', []) as VaultPositionExtended[]
	}

	async getVaultPosition(
		owner: string,
		vaultAddress: string
	): Promise<VaultPosition> {
		const response = await this.client.query({
			query: VaultPositionQuery.GetVaultPosition(this, owner, vaultAddress),
		})

		return get(response, 'data.vaultPosition', null) as VaultPosition
	}

	async getVaultPositionExtended(
		owner: string,
		vaultAddress: string
	): Promise<VaultPositionExtended> {
		const response = await this.client.query({
			query: VaultPositionQuery.GetVaultPositionExtended(
				this,
				owner,
				vaultAddress
			),
		})
		return get(response, 'data.vaultPosition', null) as VaultPositionExtended
	}

	async getVaultVotes(
		user: string,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetVaultVotes(this, user, first, skip),
		})
		return get(response, 'data.vaultVotes', []) as VaultVote[]
	}

	async getUserVaultVotesFromTimestamp(
		user: string,
		timestampFrom: number,
		timestampTo: number,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetUserVaultVotesFromTimestamp(
				this,
				user,
				timestampFrom,
				timestampTo,
				first,
				skip
			),
		})
		return get(response, 'data.vaultVotes', []) as VaultVote[]
	}

	async getAllLastVaultVotes(
		orderBy: string,
		order: string,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetAllLastVaultVotes(
				this,
				orderBy,
				order,
				first,
				skip
			),
		})
		return get(response, 'data.vaultVotes', []) as VaultVote[]
	}

	async getVoteHistory(id: string): Promise<VoteHistory> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetVoteHistoryFromId(this, id),
		})
		return get(response, 'data.voteHistory') as VoteHistory
	}

	async getLastUserStakes(): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetLastUserStakes(this),
		})
		return get(response, 'data.userStakes', []) as UserStake[]
	}

	async getUserStakes(
		startTime: number,
		user: string,
		first: number = 100,
		skip: number = 0
	): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetUserStakes(this, startTime, user, first, skip),
		})
		return get(response, 'data.userStakes', []) as UserStake[]
	}

	async getLastUserStakeFromTimestamp(
		timestamp: number,
		user: string
	): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetLastUserStakeFromTimestamp(this, timestamp, user),
		})
		return get(response, 'data.userStakes', []) as UserStake[]
	}

	async getStakeHistory(id: string): Promise<StakeHistory> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetStakeHistoryFromId(this, id),
		})
		return get(response, 'data.stakeHistory') as StakeHistory
	}

	async getStakeHistories(
		startTime: number,
		first: number = 100,
		skip: number = 0
	): Promise<StakeHistory[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetStakeHistories(this, startTime, first, skip),
		})
		return get(response, 'data.stakeHistories', []) as StakeHistory[]
	}

	async getOptionPositionsExtendedForUser(
		owner: string,
		isOpen?: boolean
	): Promise<OptionPositionExtended[]> {
		const response = await this.client.query({
			query: OptionPositionQuery.GetOptionPositionsExtendedForUser(
				this,
				owner,
				isOpen
			),
		})

		return get(response, 'data.optionPositions', []) as OptionPositionExtended[]
	}

	async getLiquidityPositionsExtendedForUser(
		owner: string,
		orderType?: OrderType
	): Promise<LiquidityPositionExtended[]> {
		const response = await this.client.query({
			query: LiquidityPositionQuery.GetLiquidityPositionsExtendedForUser(
				this,
				owner,
				orderType
			),
		})
		return get(
			response,
			'data.liquidityPositions'
		) as LiquidityPositionExtended[]
	}

	async getUserReferrals(
		user: string,
		first: number = 1000,
		skip: number = 0
	): Promise<Referral[]> {
		const response = await this.client.query({
			query: ReferralQuery.GetUserReferrals(this, user, first, skip),
		})
		return get(response, 'data.referrals', []) as Referral[]
	}
}

export default PremiaSubgraph
