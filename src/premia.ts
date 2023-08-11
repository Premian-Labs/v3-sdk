import { JsonRpcProvider, Provider, Signer, Wallet } from 'ethers'
import { providers } from '@premia/ethers-multicall'
import { merge } from 'lodash'

import * as _entities from './entities'

import {
	AnalyticsAPI,
	ContractAPI,
	OptionAPI,
	OrdersAPI,
	PoolAPI,
	PricingAPI,
	TokenAPI,
	TokenPairAPI,
	TransactionAPI,
	UserAPI,
	VaultAPI,
	VxPremiaAPI,
	ReferralAPI,
} from './api'
import { Addresses, SupportedChainId } from './constants'
import { Coingecko, OrderbookV1 } from './services'
import cache from './cache'
import PremiaSubgraph from './services/subgraph'

export interface SetProviderParams {
	/**
	 * An ethers.js provider instance or a string representing a JSON-RPC URL.
	 * This provider is used for interacting with the main exchange contracts.
	 * If not provided, a default connection string will be used.
	 *
	 * @defaultValue {@link Premia.provider}
	 */
	provider?: Provider | string
	/**
	 * An ethers.js provider instance or a string representing a JSON-RPC URL.
	 * This provider is used for interacting with the orderbook contract.
	 * If not provided, a default connection string will be used.
	 *
	 * @defaultValue {@link Premia.novaProvider}
	 */
	novaProvider?: Provider | string
}

export interface SetSignerParams {
	/**
	 * A string representing a wallet's private key for use with the `provider`,
	 * to instantiate the `signer`. Ignored if `signer` is provided.
	 */
	privateKey?: string
	/**
	 * A string representing a wallet's secret phrase for use with the `provider`,
	 * to instantiate the `signer`. Ignored if `privateKey` or `signer` is provided.
	 */
	phrase?: string
	/**
	 * An ethers.js signer instance for transacting with the main exchange contracts. If no `signer`,
	 * `privateKey`, or `phrase` is provided, the `provider`'s default signer will be used.
	 *
	 * @defaultValue {@link Premia.provider.getSigner}
	 */
	signer?: Signer
	/**
	 * A string representing a wallet's private key for use with the `novaProvider`,
	 * to instantiate the `novaSigner`. Ignored if `novaSigner` is provided.
	 */
	novaPrivateKey?: string
	/**
	 * A string representing a wallet's secret phrase for use with the `novaProvider`,
	 * to instantiate the `novaSigner`. Ignored if `novaPrivateKey` or `novaSigner` is provided.
	 */
	novaPhrase?: string
	/**
	 * An ethers.js signer instance for transacting with the orderbook contract. If no `novaSigner`,
	 * `novaPrivateKey`, or `novaPhrase` is provided, the `novaProvider`'s default signer will be used.
	 *
	 * @defaultValue {@link Premia.novaProvider.getSigner}
	 */
	novaSigner?: Signer
}

export interface SubgraphParams {
	/**
	 * The subgraph URL to use for fetching indexed contract data.
	 *
	 * @defaultValue {@link Premia.subgraph.uri}
	 * @see https://docs.premia.finance/api/subgraph
	 */
	subgraphUri?: string
}

export interface PremiaConfig
	extends SetProviderParams,
		SetSignerParams,
		SubgraphParams {
	/**
	 * The chain ID to use for interacting with main exchange contracts.
	 *
	 * @defaultValue {@link Premia.useTestnet}
	 */
	useTestnet?: boolean

	/**
	 * The chain ID to use for interacting with main exchange contracts.
	 *
	 * @defaultValue {@link Premia.chainId}
	 */
	chainId?: number

	/**
	 * The API key to use for fetching data from the Premia API.
	 *
	 * @defaultValue {@link Premia.apiKey}
	 * @see https://docs.premia.finance/api/authentication
	 */
	apiKey?: string
	/**
	 * The base URL to use for fetching data from the Premia API.
	 *
	 * @defaultValue {@link Premia.apiBaseUri}
	 * @see https://docs.premia.finance/api
	 */
	apiBaseUri?: string

	/**
	 * The base websocket URL to use for streaming data from the Premia API.
	 *
	 * @defaultValue {@link Premia.apiWsUri}
	 * @see https://docs.premia.finance/api
	 */
	apiWsUri?: string

	/**
	 * The base URL to use for fetching data from the Coingecko API.
	 *
	 * @defaultValue {@link Premia.coingeckoBaseUri}
	 * @see https://www.coingecko.com/api/documentations/v3
	 */
	coingeckoBaseUri?: string

	/**
	 * The API Key to use for fetching data from the Coingecko Pro API.
	 *
	 * @see https://www.coingecko.com/api/documentations/v3
	 */
	coingeckoProApiKey?: string

	/**
	 * A flag to disable usage of the default cache.
	 *
	 * @defaultValue {@link Premia.disableCache}
	 */
	disableCache?: boolean

	/**
	 * A flag to disable usage of the subgraph, and instead use smart contract data where available.
	 */
	skipSubgraph?: boolean

	/**
	 * The address of the OrderbookStreamer contract (on Arbitrum Nova).
	 *
	 * @defaultValue {@link Premia.orderbookAddress}
	 * @see https://docs.premia.finance/contracts/orderbook
	 */
	orderbookAddress?: string

	/**
	 * The address of the VaultRegistry contract (on Arbitrum).
	 *
	 * @defaultValue {@link Premia.vaultRegistryAddress}
	 * @see https://docs.premia.finance/contracts/vaults
	 */
	vaultRegistryAddress?: string

	/**
	 * The address of the PoolFactory contract (on Arbitrum).
	 *
	 * @defaultValue {@link Premia.poolFactoryAddress}
	 * @see https://docs.premia.finance/contracts/pools
	 */
	poolFactoryAddress?: string

	/**
	 * The address of the UserSettings contract (on Arbitrum).
	 *
	 * @defaultValue {@link Premia.userSettingsAddress}
	 * @see https://docs.premia.finance/contracts/pools
	 */
	userSettingsAddress?: string

	/**
	 * The address of the VxPremia contract (on Arbitrum).
	 *
	 * @defaultValue {@link Premia.vxPremiaAddress}
	 */
	vxPremiaAddress?: string
}

export interface PremiaConfigWithDefaults extends Required<PremiaConfig> {}

/**
 * The SDK class is the main entry point for interacting with the Premia V3 protocol.
 * It provides access to all the protocol's functionality, including, but not limited to:
 * - Querying on-chain and indexed data using various APIs and services
 * - Interacting with the main exchange contracts, including trading options
 *   and minting/burning LP tokens.
 * - Interacting with the orderbook contract and indexing API, including placing/cancelling orders.
 * - Interacting with various DeFi APIs, including fetching market data and user balances.
 * - Utilizing token lists and pair lists for interacting with the protocol.
 *
 * @public @alpha
 */
export class Premia {
	/**
	 * The ethers.js provider instance used for interacting with the main exchange contracts.
	 *
	 * @defaultValue {@link JsonRpcProvider}
	 * @see https://docs.ethers.org/v6/api/providers/#Provider
	 */
	provider: Provider

	/**
	 * The `SetProviderParams` field used to instantiate the SDK.
	 */
	providerCredentials: { rpcUrl?: string; provider?: Provider }
	/**
	 * The ethers.js provider instance used for interacting with the orderbook contract.
	 *
	 * @defaultValue {@link JsonRpcProvider}
	 * @see https://docs.ethers.org/v6/api/providers/#Provider
	 */
	novaProvider?: Provider

	/**
	 * The `SetProviderParams` field used to instantiate the SDK.
	 */
	novaProviderCredentials?: { rpcUrl?: string; provider?: Provider }

	/**
	 * The ethers.js multicall provider instance used for batched contract calls.
	 *
	 * @see https://github.com/0xsequence/sequence.js/tree/master/packages/multicall
	 */
	multicallProvider?: providers.MulticallProvider

	/**
	 * The ethers.js signer instance used for transacting with the main exchange contracts.
	 *
	 * @defaultValue {@link Wallet}
	 * @see https://docs.ethers.org/v6/api/providers/#Signer
	 */
	signer?: Signer
	/**
	 * The `SetSignerParams` field used to instantiate the SDK.
	 */
	signerCredentials?: { phrase?: string; privateKey?: string }

	/**
	 * The ethers.js signer instance used for transacting with the orderbook contract.
	 *
	 * @defaultValue {@link Wallet}
	 * @see https://docs.ethers.org/v6/api/providers/#Signer
	 */
	novaSigner?: Signer
	/**
	 * The `SetSignerParams` field used to instantiate the SDK.
	 */
	novaSignerCredentials?: { phrase?: string; privateKey?: string }

	/**
	 * @inheritdoc {@link PremiaConfig.useTestnet}
	 */
	useTestnet: boolean

	/**
	 * @inheritdoc {@link PremiaConfig.chainId}
	 */
	chainId: number

	/**
	 * @inheritdoc {@link PremiaConfig.disableCache}
	 */
	disableCache!: boolean

	/**
	 * @inheritdoc {@link PremiaConfig.skipSubgraph}
	 */
	skipSubgraph: boolean

	/**
	 * The Premia subgraph object which handles all interactions with the subgraph
	 */
	subgraph: PremiaSubgraph

	/**
	 * The service used to interact with the Coingecko v3 API.
	 *
	 * @see https://www.coingecko.com/api/documentations/v3
	 */
	coingecko: Coingecko

	/**
	 * The service used to interact with the Premia Orderbook API.
	 *
	 * @defaultValue {@link OrderbookV1}
	 * @see https://docs.premia.finance/api/orderbook
	 */
	orderbook: OrderbookV1

	/**
	 * The API used to interact with the Analytics data on Premia V3.
	 *
	 * @defaultValue {@link AnalyticsAPI}
	 */
	analytics: AnalyticsAPI = new AnalyticsAPI(this)
	/**
	 * The API used to interact with the Contracts on Premia V3.
	 *
	 * @defaultValue {@link ContractAPI}
	 */
	contracts: ContractAPI = new ContractAPI(this)
	/**
	 * The API used to interact with Options on Premia V3.
	 *
	 * @defaultValue {@link OptionAPI}
	 */
	options: OptionAPI = new OptionAPI(this)
	/**
	 * The API used to interact with Token Pairs on Premia V3.
	 *
	 * @defaultValue {@link TokenPairAPI}
	 */
	pairs: TokenPairAPI = new TokenPairAPI(this)
	/**
	 * The API used to interact with Pools on Premia V3.
	 *
	 * @defaultValue {@link PoolAPI}
	 */
	pools: PoolAPI = new PoolAPI(this)
	/**
	 * The API used to determine best pricing between quotes on Premia V3.
	 *
	 * @defaultValue {@link PricingAPI}
	 */
	pricing: PricingAPI = new PricingAPI(this)
	/**
	 * The API used to interact with the RFQ Messaging Network for Premia V3.
	 *
	 * @defaultValue {@link OrderbookAPI}
	 */
	orders: OrdersAPI = new OrdersAPI(this)
	/**
	 * The API used to interact with the Tokens on Premia V3.
	 *
	 * @defaultValue {@link TokenAPI}
	 */
	tokens: TokenAPI = new TokenAPI(this)
	/**
	 * The API used to interact with the Transactions on Premia V3.
	 *
	 * @defaultValue {@link TransactionAPI}
	 */
	transactions: TransactionAPI = new TransactionAPI(this)
	/**
	 * The API used to interact with the Users on Premia V3.
	 *
	 * @defaultValue {@link UserAPI}
	 */
	users: UserAPI = new UserAPI(this)
	/**
	 * The API used to interact with the Vaults on Premia V3.
	 *
	 * @defaultValue {@link VaultAPI}
	 */
	vaults: VaultAPI = new VaultAPI(this)
	/**
	 * The API used to interact with VxPremia for Premia V3.
	 *
	 * @defaultValue {@link VxPremiaAPI}
	 */
	vxPremia: VxPremiaAPI = new VxPremiaAPI(this)

	/**
	 * The API used to interact with referrals for Premia V3.
	 *
	 * @defaultValue {@link ReferralAPI}
	 */
	referral: ReferralAPI = new ReferralAPI(this)

	/**
	 * The static types used to interact with the Premia V3 protocol.
	 *
	 * @defaultValue {@link _entities}
	 */
	static entities: typeof _entities = _entities

	/**
	 * Creates a new Premia V3 SDK instance.
	 *
	 * @remarks
	 * The SDK needs to be initialized before it can be used with
	 * non-default parameters.
	 */
	private constructor(config: PremiaConfigWithDefaults) {
		// Setup orderbook
		this.orderbook = new OrderbookV1(
			config.apiBaseUri,
			config.apiWsUri,
			config.apiKey,
			config.chainId
		)

		// Setup coingecko
		this.coingecko = new Coingecko(
			config.coingeckoBaseUri,
			config.coingeckoProApiKey
		)

		// Setup subgraph client
		this.skipSubgraph = config.skipSubgraph
		this.setDisableCache(config.disableCache)

		this.subgraph = new PremiaSubgraph(config.subgraphUri)

		// Setup provider
		this.useTestnet = config.useTestnet
		this.chainId = config.chainId

		// Required to silence Typescript errors
		if (typeof config.provider === 'string') {
			this.provider = new JsonRpcProvider(config.provider as string)
			this.providerCredentials = { rpcUrl: config.provider }
		} else {
			this.provider = config.provider
			this.providerCredentials = { provider: config.provider }
		}

		this.setProvider(config)

		// Setup addresses for contracts
		if (Object.values(SupportedChainId).includes(this.chainId)) {
			this.contracts.setOrderbookAddress(config.orderbookAddress!)
			this.contracts.setPoolFactoryAddress(config.poolFactoryAddress!)
			this.contracts.setVaultRegistryAddress(config.vaultRegistryAddress!)
			this.contracts.setUserSettingsAddress(config.userSettingsAddress!)
			this.contracts.setVxPremiaAddress(config.vxPremiaAddress!)
		}
	}

	/**
	 * Builds the SDK with the provided parameters.
	 *
	 * @remarks
	 * Default parameters will be used for any values not passed.
	 *
	 * @returns A promise that resolves when the SDK has been initialized.
	 * @param config
	 */
	public static async initialize(config: PremiaConfig = {}): Promise<Premia> {
		const finalConfig = Premia.getDefaultConfig(config)
		const premia = new Premia(finalConfig)

		await premia.setSigner(finalConfig)

		return premia
	}

	/**
	 * Builds the SDK with the provided parameters, synchronously.
	 *
	 * @remarks
	 * Async signers are not supported, use async `initialize` if necessary.
	 * Default parameters will be used for any values not passed.
	 *
	 * @returns The synchronously initialized SDK.
	 * @param config
	 */
	public static initializeSync(config: PremiaConfig = {}): Premia {
		const finalConfig = Premia.getDefaultConfig(config)
		const premia = new Premia(finalConfig)

		premia.setSignerSync(finalConfig)

		return premia
	}

	private static getDefaultConfig(
		config: Partial<PremiaConfig> = {}
	): PremiaConfigWithDefaults {
		const defaultConfig: PremiaConfig = {
			provider: config.useTestnet
				? 'https://goerli-rollup.arbitrum.io/rpc	'
				: 'https://arb1.arbitrum.io/rpc',
			novaProvider: 'https://nova.arbitrum.io/rpc',
			useTestnet: config.useTestnet ?? true,
			chainId: config.useTestnet
				? SupportedChainId.ARBITRUM_GOERLI
				: SupportedChainId.ARBITRUM,
			apiKey: '[email dev@premia.finance to get a key]',
			apiBaseUri: `https://${
				config.useTestnet === false ? '' : 'test.'
			}orderbook.premia.finance`,
			apiWsUri: `wss://${
				config.useTestnet === false ? '' : 'test.'
			}quotes.premia.finance`,
			coingeckoBaseUri: 'https://api.coingecko.com/api/v3',
			disableCache: false,
			skipSubgraph: false,
			subgraphUri: 'https://api.thegraph.com/subgraphs/name/totop716/premia-v3',
		}

		const merged = merge(defaultConfig, config) as PremiaConfigWithDefaults

		merged.orderbookAddress =
			Addresses[SupportedChainId.ARBITRUM_NOVA].ORDERBOOK
		merged.poolFactoryAddress =
			Addresses[merged.chainId as keyof typeof Addresses].POOL_FACTORY
		merged.vaultRegistryAddress =
			Addresses[merged.chainId as keyof typeof Addresses].VAULT_REGISTRY
		merged.userSettingsAddress =
			Addresses[merged.chainId as keyof typeof Addresses].USER_SETTINGS
		merged.vxPremiaAddress =
			Addresses[merged.chainId as keyof typeof Addresses].VX_PREMIA

		return merged
	}

	/**
	 * @param [disableCache] - {@link PremiaConfig.disableCache}
	 */
	setDisableCache(disableCache: PremiaConfig['disableCache']) {
		this.disableCache = disableCache ?? this.disableCache
		cache.disabled = this.disableCache
	}

	get apiKey(): string {
		return this.orderbook.apiKey
	}

	/**
	 * @param [apiKey] - {@link PremiaConfig.apiKey}
	 */
	set apiKey(apiKey: string) {
		this.orderbook.apiKey = apiKey
	}

	get apiBaseUri(): string {
		return this.orderbook.uri
	}

	/**
	 * @param [uri] - {@link PremiaConfig.apiBaseUri}
	 */
	set apiBaseUri(uri: string) {
		this.orderbook.uri = uri
	}

	get apiWsUri(): string {
		return this.orderbook.wsUri
	}

	/**
	 * @param [wsUri] - {@link PremiaConfig.apiWsUri}
	 */
	set apiWsUri(wsUri: string) {
		this.orderbook.wsUri = wsUri
	}

	get coingeckoBaseUri(): string {
		return this.coingecko.uri
	}

	/**
	 * @param [uri] - {@link PremiaConfig.coingeckoBaseUri}
	 */
	set coingeckoBaseUri(uri: string) {
		this.coingecko.uri = uri
	}

	get coingeckoProApiKey(): PremiaConfig['coingeckoProApiKey'] {
		return this.coingecko.apiKey
	}

	/**
	 * @param [apiKey] - {@link PremiaConfig.coingeckoProApiKey}
	 */
	set coingeckoProApiKey(apiKey: PremiaConfig['coingeckoProApiKey']) {
		this.coingecko.apiKey = apiKey ?? this.coingeckoProApiKey
	}

	/**
	 * @param [skipSubgraph] - {@link PremiaConfig.skipSubgraph}
	 */
	setSkipSubgraph(skipSubgraph: PremiaConfig['skipSubgraph']) {
		this.skipSubgraph = skipSubgraph ?? this.skipSubgraph
	}

	/**
	 * @param [params] - {@link SetProviderParams}
	 */
	setProvider(params: SetProviderParams) {
		const { provider, novaProvider } = params

		if (typeof provider === 'string') {
			this.provider = new JsonRpcProvider(provider as string)
			this.providerCredentials = { rpcUrl: provider }
		} else if (provider) {
			this.provider = provider
			this.providerCredentials = { provider }
		}

		this.multicallProvider = new providers.MulticallProvider(this.provider)

		if (typeof novaProvider === 'string') {
			this.novaProvider = new JsonRpcProvider(novaProvider as string)
			this.novaProviderCredentials = { rpcUrl: novaProvider }
		} else if (novaProvider) {
			this.novaProvider = novaProvider
			this.novaProviderCredentials = { provider: novaProvider }
		}
	}

	/**
	 * @param [params] - {@link SetSignerParams}
	 */
	async setSigner(params: SetSignerParams) {
		const {
			privateKey,
			phrase,
			signer,
			novaPrivateKey,
			novaPhrase,
			novaSigner,
		} = params

		if (signer) {
			this.signer = signer
		} else if (privateKey) {
			const _privateKey = privateKey.startsWith('0x')
				? privateKey
				: `0x${privateKey}`
			this.signer = new Wallet(_privateKey, this.provider)
			this.signerCredentials = { privateKey }
		} else if (phrase) {
			this.signer = Wallet.fromPhrase(phrase, this.provider)
			this.signerCredentials = { phrase }
		} else if (this.provider instanceof JsonRpcProvider) {
			try {
				this.signer = await this.provider.getSigner()
			} catch (e) {}
		}

		if (novaSigner) {
			this.novaSigner = novaSigner
		} else if (novaPrivateKey) {
			const _privateKey = novaPrivateKey.startsWith('0x')
				? novaPrivateKey
				: `0x${novaPrivateKey}`
			this.novaSigner = new Wallet(_privateKey, this.novaProvider)
			this.novaSignerCredentials = { privateKey: novaPrivateKey }
		} else if (novaPhrase) {
			this.novaSigner = Wallet.fromPhrase(novaPhrase, this.novaProvider)
			this.novaSignerCredentials = { phrase: novaPhrase }
		} else if (this.novaProvider instanceof JsonRpcProvider) {
			try {
				this.novaSigner = await this.novaProvider.getSigner()
			} catch (e) {}
		}
	}

	/**
	 * @remarks
	 * This method is synchronous and will not initialize via `this.provider.getSigner()`.
	 * If this behavior is required, use `async setSigner()`.
	 *
	 * @param [params] - {@link SetSignerParams}
	 */
	setSignerSync(params: SetSignerParams) {
		const {
			privateKey,
			phrase,
			signer,
			novaPrivateKey,
			novaPhrase,
			novaSigner,
		} = params

		if (signer) {
			this.signer = signer
		} else if (privateKey) {
			const _privateKey = privateKey.startsWith('0x')
				? privateKey
				: `0x${privateKey}`
			this.signer = new Wallet(_privateKey, this.provider)
			this.signerCredentials = { privateKey }
		} else if (phrase) {
			this.signer = Wallet.fromPhrase(phrase, this.provider)
			this.signerCredentials = { phrase }
		}

		if (novaSigner) {
			this.novaSigner = novaSigner
		} else if (novaPrivateKey) {
			const _privateKey = novaPrivateKey.startsWith('0x')
				? novaPrivateKey
				: `0x${novaPrivateKey}`
			this.novaSigner = new Wallet(_privateKey, this.novaProvider)
			this.novaSignerCredentials = { privateKey: novaPrivateKey }
		} else if (novaPhrase) {
			this.novaSigner = Wallet.fromPhrase(novaPhrase, this.novaProvider)
			this.novaSignerCredentials = { phrase: novaPhrase }
		}
	}

	/**
	 * @param factoryAddress - {@link PremiaConfig.poolFactoryAddress}
	 */
	setPoolFactoryAddress(factoryAddress: string) {
		this.contracts.setPoolFactoryAddress(factoryAddress)
	}

	/**
	 * @param registryAddress - {@link PremiaConfig.vaultRegistryAddress}
	 */
	setVaultRegistryAddress(registryAddress: string) {
		this.contracts.setVaultRegistryAddress(registryAddress)
	}

	/**
	 * @param settingsAddress - {@link PremiaConfig.vaultRegistryAddress}
	 */
	setUserSettingsAddress(settingsAddress: string) {
		this.contracts.setUserSettingsAddress(settingsAddress)
	}

	/**
	 * @param vxPremiaAddress - {@link PremiaConfig.vxPremiaAddress}
	 */
	setVxPremiaAddress(vxPremiaAddress: string) {
		this.contracts.setVxPremiaAddress(vxPremiaAddress)
	}

	/**
	 * Cancel all open quote streams.
	 */
	async cancelAllStreams(): Promise<void> {
		this.orders.cancelAllStreams()
		this.provider?.removeAllListeners()
	}

	/**
	 * Cancel all contract event listeners.
	 */
	async cancelAllEventStreams(): Promise<void> {
		this.provider?.removeAllListeners()
	}

	/**
	 * Return the serialialized SDK constructor params used to instantiate the SDK.
	 *
	 * @returns {@link PremiaConfig}
	 */
	toParams(): PremiaConfig {
		return {
			useTestnet: this.useTestnet,
			chainId: this.chainId,
			provider: (this.providerCredentials?.provider ??
				this.providerCredentials?.rpcUrl) as Provider | string,
			novaProvider:
				this.novaProviderCredentials?.provider ??
				this.novaProviderCredentials?.rpcUrl,
			privateKey: this.signerCredentials?.privateKey,
			phrase: this.signerCredentials?.phrase,
			novaPrivateKey: this.novaSignerCredentials?.privateKey,
			novaPhrase: this.novaSignerCredentials?.phrase,
			subgraphUri: this.subgraph.uri,
			skipSubgraph: this.skipSubgraph,
			disableCache: this.disableCache,
			apiKey: this.apiKey,
			apiBaseUri: this.apiBaseUri,
			apiWsUri: this.apiWsUri,
			coingeckoBaseUri: this.coingeckoBaseUri,
			coingeckoProApiKey: this.coingeckoProApiKey,
			orderbookAddress: this.contracts.orderbookAddress,
			poolFactoryAddress: this.contracts.poolFactoryAddress,
			vaultRegistryAddress: this.contracts.vaultRegistryAddress,
			userSettingsAddress: this.contracts.userSettingsAddress,
		}
	}
}

export default Premia
