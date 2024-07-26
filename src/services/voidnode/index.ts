import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
} from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { TokenInfo } from '@premia/pair-lists/src/types'
import { BigNumberish, toBigInt } from 'ethers'
import { get } from 'lodash'
import fetch from 'cross-fetch'

import {
	LiquidityPositionExtended,
	OptionPositionExtended,
	OptionPSTransaction,
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
	Transaction,
	TradingCompetitionUser,
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
	OptionPSTransactionQuery,
} from './graphql'
import { DefaultApolloClientOptions } from '../../constants'
import { QueryParams, convertAllBigDecimalToBigInt } from '../../utils'
import { TokenOrAddress, TokenPairOrId } from '../../api'

export interface VoidnodeAuthentication {
	apiId: string
	apiKey: string
}

/**
 * The PremiaVoidnode class is the entry point for interacting with the Premia V3 voidnode server
 * to query on-chain and indexed data using various APIs and services.

 *
 * @public @alpha
 */
export class PremiaVoidnode {
	/**
	 * The voidnode URL to use for fetching indexed contract data.
	 */
	uri: string

	/**
	 * The apollo voidnode client used to fetch data from the Premia voidnode server.
	 *
	 * @defaultValue {@link ApolloClient}
	 */
	client: ApolloClient<NormalizedCacheObject>

	/**
	 * The voidnode-specific parameters to be used for upcoming voidnode queries.
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
	constructor(uri: string, authentication?: VoidnodeAuthentication) {
		this.uri = uri ?? 'https://localhost:4000'

		const httpLink = new HttpLink({ uri: this.uri, fetch })
		const authLink = setContext((_, { headers }) => {
			return {
				headers: {
					...headers,
					...(authentication
						? {
								'x-api-id': authentication?.apiId,
								authorization: `Bearer ${authentication?.apiKey}`,
						  }
						: {}),
				},
			}
		})

		this.client = new ApolloClient({
			link: authLink.concat(httpLink),
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

	/**
	 * Parses a token input to return a token address string.
	 *
	 * @param {TokenOrAddress} token - The token input which can be either a Token object or a string representing the address.
	 * @returns {string} - The token address as a string.
	 */
	_parseTokenAddress(token: TokenOrAddress): string {
		let tokenAddress: string
		if (get(token, 'address')) {
			tokenAddress = (token as Token).address
		} else {
			tokenAddress = token as string
		}
		return tokenAddress
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

	tradeSide(isBuy: boolean): bigint {
		return isBuy ? 0n : 1n
	}

	optionType(isCall: boolean): bigint {
		return isCall ? 0n : 1n
	}

	async getVaultDayData(
		vaultAddress: string,
		startTime = 0,
		limit: number = 1000,
		skip: number = 0
	): Promise<VaultDayData[]> {
		const response = await this.client.query({
			query: AnalyticsQuery.GetVaultDayData(
				this,
				vaultAddress,
				startTime,
				limit,
				skip
			),
		})
		const data = get(response, 'data.vaultDayDatas', []) as VaultDayData[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPoolsOrderbookData(addresses: string[]): Promise<PoolDayData[]> {
		const response = await this.client.query({
			query: AnalyticsQuery.GetPoolsOrderbookData(this, addresses),
		})
		const data = get(response, 'data.poolDayDatas', []) as PoolDayData[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pool') as PoolMinimal
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pool') as Pool
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pool') as PoolExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getPools(baseAddress: string, isExpired?: boolean): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPools(this, baseAddress, isExpired),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		const data = get(response, 'data.pools', []) as Pool[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPoolsExtended(
		baseAddress: string,
		isExpired?: boolean
	): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsExtended(this, baseAddress, isExpired),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		const data = get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pools', []) as Pool[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as Pool
		) as Pool[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(response, 'data.pools', []).map(
			(pool: Omit<Pool, 'contract'>) => pool as PoolExtended
		) as PoolExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPoolsForPairId(id: string): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsForPairId(this, id),
		})
		const data = get(response, 'data.pools', []) as Pool[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPoolsForPair(
		pair: TokenPairOrId,
		isExpired?: boolean
	): Promise<Pool[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsForPair(this, pair, isExpired),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		const data = get(response, 'data.pools', []) as Pool[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPoolsExtendedForPair(
		pair: TokenPairOrId,
		options?: {
			strike?: BigNumberish
			maturity?: BigNumberish
			isExpired?: boolean
		}
	): Promise<PoolExtended[]> {
		const response = await this.client.query({
			query: PoolQuery.GetPoolsExtendedForPair(this, pair, options),
		})

		if (!response.data) {
			throw new Error(
				'Pools not found. If no pools have been initialized, use the `basePoolFromKey` method.'
			)
		}

		const data = get(response, 'data.pools', []) as PoolExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTicksForPool(poolAddress: string): Promise<Tick[]> {
		const response = await this.client.query({
			query: PoolQuery.GetTicks(this, poolAddress),
		})

		if (!get(response, 'data.ticks')) {
			throw new Error(
				'Ticks not found. If pool has not been initialized, use the `deployPool` method limit.'
			)
		}
		const data = get(response, 'data.ticks', []) as Tick[]
		return convertAllBigDecimalToBigInt(data)
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
		const data = get(response, 'data.pools', []) as PoolMinimal[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTick(normalizedPrice: BigNumberish, poolAddress: string) {
		const response = await this.client.query({
			query: TickQuery.GetTick(this, normalizedPrice, poolAddress),
		})

		if (!get(response, 'data.tick')) {
			throw new Error(
				'Tick not found. If pool has been initialized, use the `deployPool` method limit.'
			)
		}
		const data = get(response, 'data.tick', null) as Tick
		return convertAllBigDecimalToBigInt(data)
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
		const data = get(response, 'data.token') as Token
		return convertAllBigDecimalToBigInt(data)
	}

	async getTokenExtended(address: string): Promise<TokenExtended> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenExtended(this, address),
		})
		const data = get(response, 'data.token') as TokenExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getTokens(tokens: string[]): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokens(this, tokens),
		})
		const data = get(response, 'data.tokens') as Token[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTokensExtended(tokens: string[]): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokensExtended(this, tokens),
		})
		const data = get(response, 'data.tokens') as TokenExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllTokens(): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetAllTokens(this),
		})
		const data = get(response, 'data.tokens') as Token[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllTokensExtended(): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetAllTokensExtended(this),
		})
		const data = get(response, 'data.tokens') as TokenExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTokenList(tokenList: TokenInfo[]): Promise<Token[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenList(this, tokenList),
		})
		const data = get(response, 'data.tokens') as Token[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTokenListExtended(tokenList: TokenInfo[]): Promise<TokenExtended[]> {
		const response = await this.client.query({
			query: TokenQuery.GetTokenListExtended(this, tokenList),
		})
		const data = get(response, 'data.tokens') as TokenExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPair(pair: TokenPairOrId): Promise<TokenPair> {
		const pairId = this._parsePairId(pair)
		const response = await this.client.query({
			query: TokenPairQuery.GetPair(this, pairId),
		})

		const tokenPair = get(response, 'data.tokenPair') as TokenPair

		if (!tokenPair.base || !tokenPair.quote) {
			throw new Error('Invalid pair. Pair was not found on voidnode.')
		}

		return convertAllBigDecimalToBigInt(tokenPair)
	}

	async getPairExtended(pair: TokenPairOrId): Promise<TokenPairExtended> {
		const pairId = this._parsePairId(pair)
		const response = await this.client.query({
			query: TokenPairQuery.GetPairExtended(this, pairId),
		})
		const tokenPair = get(response, 'data.tokenPair') as TokenPairExtended

		if (!tokenPair.base || !tokenPair.quote) {
			throw new Error('Invalid pair. Pair was not found on voidnode.')
		}

		return convertAllBigDecimalToBigInt(tokenPair)
	}

	async getPairs(pairs: TokenPairOrId[]): Promise<TokenPair[]> {
		const pairIds = pairs.map((pair) => this._parsePairId(pair))
		const response = await this.client.query({
			query: TokenPairQuery.GetPairs(this, pairIds),
		})
		const data = get(response, 'data.tokenPairs') as TokenPair[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getPairsExtended(pairs: TokenPairOrId[]): Promise<TokenPairExtended[]> {
		const _pairIds = pairs.map((pair) => this._parsePairId(pair))
		const response = await this.client.query({
			query: TokenPairQuery.GetPairsExtended(this, _pairIds),
		})

		const data = get(response, 'data.tokenPairs') as TokenPairExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllPairs(): Promise<TokenPair[]> {
		const response = await this.client.query({
			query: TokenPairQuery.GetAllPairs(this),
		})
		const data = get(response, 'data.tokenPairs') as TokenPair[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllPairsExtended(): Promise<TokenPairExtended[]> {
		const response = await this.client.query({
			query: TokenPairQuery.GetAllPairsExtended(this),
		})

		const data = get(response, 'data.tokenPairs') as TokenPairExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTransaction(hash: string): Promise<Transaction> {
		const response = await this.client.query({
			query: TransactionQuery.GetTransaction(this, hash),
		})
		const data = get(response, 'data.transaction') as Transaction
		return convertAllBigDecimalToBigInt(data)
	}

	async getTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit: number = 100,
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
				limit,
				skip,
				type,
				poolAddress,
				account,
				startTime,
				endTime,
				searchInput
			),
		})

		const data = get(response, 'data.transactions') as Transaction[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultTransaction(hash: string): Promise<VaultTransaction> {
		const response = await this.client.query({
			query: VaultTransactionQuery.GetVaultTransaction(this, hash),
		})
		const data = get(response, 'data.vaultTransaction') as VaultTransaction
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit: number = 100,
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
				limit,
				skip,
				type,
				vaultAddress,
				account,
				startTime,
				endTime,
				searchInput
			),
		})
		const data = get(response, 'data.vaultTransactions') as VaultTransaction[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getOptionPSTransaction(hash: string): Promise<OptionPSTransaction> {
		const response = await this.client.query({
			query: OptionPSTransactionQuery.GetOptionPSTransaction(this, hash),
		})
		const data = get(
			response,
			'data.optionPSTransaction'
		) as OptionPSTransaction
		return convertAllBigDecimalToBigInt(data)
	}

	async getOptionPSTransactions(
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit: number = 100,
		skip: number = 0,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<OptionPSTransaction[]> {
		const response = await this.client.query({
			query: OptionPSTransactionQuery.GetOptionPSTransactions(
				this,
				search,
				orderBy,
				order,
				limit,
				skip,
				account,
				startTime,
				endTime,
				searchInput
			),
		})
		const data = get(
			response,
			'data.optionPSTransactions'
		) as OptionPSTransaction[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getTradingCompetitionUser(
		address: string
	): Promise<TradingCompetitionUser> {
		const response = await this.client.query({
			query: UserQuery.GetTradingCompetitionUser(this, address),
		})
		const data = get(
			response,
			'data.tradingCompetitionUser'
		) as TradingCompetitionUser
		return convertAllBigDecimalToBigInt(data)
	}

	async getUser(address: string): Promise<User> {
		const response = await this.client.query({
			query: UserQuery.GetUser(this, address),
		})
		const data = get(response, 'data.user') as User
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserExtended(address: string): Promise<UserExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserExtended(this, address),
		})
		const data = get(response, 'data.user') as UserExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getUsers(addresses: string[]): Promise<User[]> {
		const response = await this.client.query({
			query: UserQuery.GetUsers(this, addresses),
		})
		const data = get(response, 'data.users', []) as User[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUsersExtended(addresses: string[]): Promise<UserExtended[]> {
		const response = await this.client.query({
			query: UserQuery.GetUsersExtended(this, addresses),
		})
		const data = get(response, 'data.users', []) as UserExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserSnapshot(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshot> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshot(this, address, timestamp),
		})
		const data = get(response, 'data.userSnapshot') as UserSnapshot
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserSnapshotExtended(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshotExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshotExtended(this, address, timestamp),
		})
		const data = get(response, 'data.userSnapshot') as UserSnapshotExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserSnapshots(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit: number = 100,
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
				limit,
				skip
			),
		})
		const data = get(response, 'data.userSnapshots', []) as UserSnapshot[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserSnapshotsExtended(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'ASC',
		limit: number = 100,
		skip: number = 0
	): Promise<UserSnapshotExtended[]> {
		const response = await this.client.query({
			query: UserQuery.GetUserSnapshotsExtended(
				address,
				startTime,
				endTime,
				orderBy,
				order,
				limit,
				skip
			),
		})
		const data = get(
			response,
			'data.userSnapshots',
			[]
		) as UserSnapshotExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserPortfolio(address: string): Promise<UserPortfolio> {
		const response = await this.client.query({
			query: UserQuery.GetUserPortfolio(this, address),
		})
		const data = get(response, 'data.user') as UserPortfolio
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserPortfolioExtended(
		address: string
	): Promise<UserPortfolioExtended> {
		const response = await this.client.query({
			query: UserQuery.GetUserPortfolioExtended(this, address),
		})
		const data = get(response, 'data.user') as UserPortfolioExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getVault(address: string): Promise<Vault> {
		const response = await this.client.query({
			query: VaultQuery.GetVault(this, address),
		})
		const data = get(response, 'data.vault', null) as Vault
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultExtended(address: string): Promise<VaultExtended> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultExtended(this, address),
		})
		const data = get(response, 'data.vault', null) as VaultExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllVaultsExtended(): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetAllVaultsExtended(this),
		})
		const data = get(response, 'data.vaults', []) as VaultExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaults(baseAddress: string): Promise<Vault[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaults(this, baseAddress),
		})
		const data = get(response, 'data.vaults', []) as Vault[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultsExtended(baseAddress: string): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsExtended(this, baseAddress),
		})
		const data = get(response, 'data.vaults', []) as VaultExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultsForToken(
		token: TokenOrAddress,
		isQuote: boolean = false
	): Promise<Vault[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsForToken(this, token),
		})
		const data = get(response, 'data.vaults', []) as Vault[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultsExtendedForToken(
		token: TokenOrAddress,
		isQuote: boolean = false
	): Promise<VaultExtended[]> {
		const response = await this.client.query({
			query: VaultQuery.GetVaultsExtendedForToken(this, token),
		})
		const data = get(response, 'data.vaults', []) as VaultExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultPositionsExtendedForUser(
		owner: string
	): Promise<VaultPositionExtended[]> {
		const response = await this.client.query({
			query: VaultPositionQuery.GetVaultPositionsExtendedForUser(this, owner),
		})
		const data = get(
			response,
			'data.vaultPositions',
			[]
		) as VaultPositionExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultPosition(
		owner: string,
		vaultAddress: string
	): Promise<VaultPosition> {
		const response = await this.client.query({
			query: VaultPositionQuery.GetVaultPosition(this, owner, vaultAddress),
		})

		const data = get(response, 'data.vaultPosition', null) as VaultPosition
		return convertAllBigDecimalToBigInt(data)
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
		const data = get(
			response,
			'data.vaultPosition',
			null
		) as VaultPositionExtended
		return convertAllBigDecimalToBigInt(data)
	}

	async getVaultVotes(
		user: string,
		limit: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetVaultVotes(this, user, limit, skip),
		})
		const data = get(response, 'data.vaultVotes', []) as VaultVote[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserVaultVotesFromTimestamp(
		user: string,
		timestampFrom: number,
		timestampTo: number,
		limit: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetUserVaultVotesFromTimestamp(
				this,
				user,
				timestampFrom,
				timestampTo,
				limit,
				skip
			),
		})
		const data = get(response, 'data.vaultVotes', []) as VaultVote[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getAllLastVaultVotes(
		orderBy: string,
		order: string,
		limit: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetAllLastVaultVotes(
				this,
				orderBy,
				order,
				limit,
				skip
			),
		})
		const data = get(response, 'data.vaultVotes', []) as VaultVote[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getVoteHistory(id: string): Promise<VoteHistory> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetVoteHistoryFromId(this, id),
		})
		const data = get(response, 'data.voteHistory') as VoteHistory
		return convertAllBigDecimalToBigInt(data)
	}

	async getLastUserStakes(): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetLastUserStakes(this),
		})
		const data = get(response, 'data.userStakes', []) as UserStake[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserStakes(
		startTime: number,
		user: string,
		limit: number = 100,
		skip: number = 0
	): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetUserStakes(this, startTime, user, limit, skip),
		})
		const data = get(response, 'data.userStakes', []) as UserStake[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getLastUserStakeFromTimestamp(
		timestamp: number,
		user: string
	): Promise<UserStake[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetLastUserStakeFromTimestamp(this, timestamp, user),
		})
		const data = get(response, 'data.userStakes', []) as UserStake[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getStakeHistory(id: string): Promise<StakeHistory> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetStakeHistoryFromId(this, id),
		})
		const data = get(response, 'data.stakeHistory') as StakeHistory
		return convertAllBigDecimalToBigInt(data)
	}

	async getStakeHistories(
		startTime: number,
		limit: number = 100,
		skip: number = 0
	): Promise<StakeHistory[]> {
		const response = await this.client.query({
			query: VxPremiaQuery.GetStakeHistories(this, startTime, limit, skip),
		})
		const data = get(response, 'data.stakeHistories', []) as StakeHistory[]
		return convertAllBigDecimalToBigInt(data)
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

		const data = get(
			response,
			'data.optionPositions',
			[]
		) as OptionPositionExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getRewardOptionPositionsExtendedForUser(
		owner: string,
		timestamp?: number,
		isOpen?: boolean
	): Promise<OptionPositionExtended[]> {
		const response = await this.client.query({
			query: OptionPositionQuery.GetRewardOptionPositionsExtendedForUser(
				this,
				owner,
				timestamp,
				isOpen
			),
		})

		const data = get(
			response,
			'data.optionPositions',
			[]
		) as OptionPositionExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getLiquidityPositionsExtendedForUser(
		owner: string,
		orderType?: OrderType,
		isOpen?: boolean
	): Promise<LiquidityPositionExtended[]> {
		const response = await this.client.query({
			query: LiquidityPositionQuery.GetLiquidityPositionsExtendedForUser(
				this,
				owner,
				orderType,
				isOpen
			),
		})
		const data = get(
			response,
			'data.liquidityPositions'
		) as LiquidityPositionExtended[]
		return convertAllBigDecimalToBigInt(data)
	}

	async getUserReferrals(
		user: string,
		limit: number = 1000,
		skip: number = 0
	): Promise<Referral[]> {
		const response = await this.client.query({
			query: ReferralQuery.GetUserReferrals(this, user, limit, skip),
		})
		const data = get(response, 'data.referrals', []) as Referral[]
		return convertAllBigDecimalToBigInt(data)
	}
}

export default PremiaVoidnode
