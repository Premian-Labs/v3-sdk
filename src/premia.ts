import {
	AbstractProvider,
	JsonRpcProvider,
	Provider,
	Signer,
	Wallet,
} from 'ethers'
import { MulticallProvider, MulticallWrapper } from 'ethers-multicall-provider'
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
	OptionPSAPI,
	OptionRewardAPI,
	MiningAPI,
	GasAPI,
} from './api'
import { Addresses, SupportedChainId } from './constants'
import { Coingecko, OrderbookV1 } from './services'
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
	 * @defaultValue {@link Premia.orderbookProvider}
	 */
	orderbookProvider?: Provider | string
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
	 * A string representing a wallet's private key for use with the `orderbookProvider`,
	 * to instantiate the `orderbookSigner`. Ignored if `orderbookSigner` is provided.
	 */
	orderbookPrivateKey?: string
	/**
	 * A string representing a wallet's secret phrase for use with the `orderbookProvider`,
	 * to instantiate the `orderbookSigner`. Ignored if `orderbookPrivateKey` or `orderbookSigner` is provided.
	 */
	orderbookPhrase?: string
	/**
	 * An ethers.js signer instance for transacting with the orderbook contract. If no `orderbookSigner`,
	 * `orderbookPrivateKey`, or `orderbookPhrase` is provided, the `orderbookProvider`'s default signer will be used.
	 *
	 * @defaultValue {@link Premia.orderbookProvider.getSigner}
	 */
	orderbookSigner?: Signer
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
	 * The chain ID to use for interacting with the auxiliary orderbook contract.
	 *
	 * @defaultValue {@link Premia.chainId}
	 */
	orderbookChainId?: number

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
	 * The address of the PremiaDiamond contract (on Arbitrum).
	 * @defaultValue {@link Premia.poolDiamondAddress}
	 * @see https://docs.premia.finance/contracts/pools
	 */
	poolDiamondAddress?: string

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

	/**
	 * The address of the VaultMining contract (on Arbitrum).
	 *
	 * @defaultValue {@link Premia.vaultMiningAddress}
	 */
	vaultMiningAddress?: string
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
	 * The ethers.js multicall provider instance used for batched contract calls.
	 *
	 * @see https://github.com/Rubilmax/ethers-multicall-provider
	 */
	multicallProvider: MulticallProvider

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
	orderbookProvider?: Provider

	/**
	 * The `SetProviderParams` field used to instantiate the SDK.
	 */
	orderbookProviderCredentials?: { rpcUrl?: string; provider?: Provider }

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
	 * The address of the signer, if a signer is set.
	 */
	signerAddress?: string

	/**
	 * The ethers.js signer instance used for transacting with the orderbook contract.
	 *
	 * @defaultValue {@link Wallet}
	 * @see https://docs.ethers.org/v6/api/providers/#Signer
	 */
	orderbookSigner?: Signer
	/**
	 * The `SetSignerParams` field used to instantiate the SDK.
	 */
	orderbookSignerCredentials?: { phrase?: string; privateKey?: string }
	/**
	 * The address of the orderbook signer, if an orderbook signer is set.
	 */
	orderbookSignerAddress?: string

	/**
	 * @inheritdoc {@link PremiaConfig.useTestnet}
	 */
	useTestnet: boolean

	/**
	 * @inheritdoc {@link PremiaConfig.chainId}
	 */
	chainId: number

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
	 * @defaultValue {@link OrdersAPI}
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
	 * The API used to interact with liquidity mining for Premia V3.
	 *
	 * @defaultValue {@link MiningAPI}
	 */
	mining: MiningAPI = new MiningAPI(this)

	/**
	 * The API used to interact with gas for Premia V3.
	 *
	 * @defaultValue {@link GasAPI}
	 */
	gas: GasAPI = new GasAPI(this)

	/**
	 * The API used to interact with optionPS for Premia V3.
	 *
	 * @defaultValue {@link OptionPSAPI}
	 */
	optionPS: OptionPSAPI = new OptionPSAPI(this)

	/**
	 * The API used to interact with option reward for Premia V3.
	 *
	 * @defaultValue {@link OptionRewardAPI}
	 */
	optionReward: OptionRewardAPI = new OptionRewardAPI(this)

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

		// Required to silence Typescript errors
		this.multicallProvider = MulticallWrapper.wrap(
			this.provider as AbstractProvider
		)

		this.setProvider(config)

		// Setup addresses for contracts
		if (Object.values(SupportedChainId).includes(this.chainId)) {
			this.contracts.setOrderbookAddress(config.orderbookAddress!)
			this.contracts.setPoolFactoryAddress(config.poolFactoryAddress!)
			this.contracts.setPoolDiamondAddress(config.poolDiamondAddress!)
			this.contracts.setVaultRegistryAddress(config.vaultRegistryAddress!)
			this.contracts.setUserSettingsAddress(config.userSettingsAddress!)
			this.contracts.setVxPremiaAddress(config.vxPremiaAddress!)
			this.contracts.setVaultMiningAddress(config.vaultMiningAddress!)
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
				? 'https://goerli-rollup.arbitrum.io/rpc'
				: 'https://arb1.arbitrum.io/rpc',
			orderbookProvider: config.useTestnet
				? 'https://goerli-rollup.arbitrum.io/rpc'
				: 'https://nova.arbitrum.io/rpc',
			useTestnet: config.useTestnet ?? true,
			chainId: config.useTestnet
				? SupportedChainId.ARBITRUM_GOERLI
				: SupportedChainId.ARBITRUM,
			orderbookChainId: config.useTestnet
				? SupportedChainId.ARBITRUM_GOERLI
				: SupportedChainId.ARBITRUM_NOVA,
			apiKey: '[email dev@premia.finance to get a key]',
			apiBaseUri: `https://${
				config.useTestnet === false ? '' : 'test.'
			}orderbook.premia.finance`,
			apiWsUri: `wss://${
				config.useTestnet === false ? '' : 'test.'
			}quotes.premia.finance`,
			coingeckoBaseUri: 'https://api.coingecko.com/api/v3',
			skipSubgraph: false,
			subgraphUri: config.useTestnet
				? 'https://api.thegraph.com/subgraphs/name/premian-labs/premia-blue-arbitrum-goerli'
				: 'https://api.thegraph.com/subgraphs/name/premian-labs/premia-blue',
		}

		const merged = merge(defaultConfig, config) as PremiaConfigWithDefaults

		merged.orderbookAddress =
			Addresses[merged.orderbookChainId as keyof typeof Addresses].ORDERBOOK
		merged.poolFactoryAddress =
			Addresses[merged.chainId as keyof typeof Addresses].POOL_FACTORY
		merged.poolDiamondAddress =
			Addresses[merged.chainId as keyof typeof Addresses].POOL_DIAMOND
		merged.vaultRegistryAddress =
			Addresses[merged.chainId as keyof typeof Addresses].VAULT_REGISTRY
		merged.userSettingsAddress =
			Addresses[merged.chainId as keyof typeof Addresses].USER_SETTINGS
		merged.vxPremiaAddress =
			Addresses[merged.chainId as keyof typeof Addresses].VX_PREMIA
		merged.vaultMiningAddress =
			Addresses[merged.chainId as keyof typeof Addresses].VAULT_MINING

		return merged
	}

	/**
	 * @param uri - A uri associated with the PremiaSubgraph.
	 */
	set subgraphUri(uri: string) {
		this.subgraph = new PremiaSubgraph(uri)
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
		const { provider, orderbookProvider } = params

		if (typeof provider === 'string') {
			this.provider = new JsonRpcProvider(provider as string)
			this.providerCredentials = { rpcUrl: provider }
		} else if (provider) {
			this.provider = provider
			this.providerCredentials = { provider }
		}

		this.multicallProvider = MulticallWrapper.wrap(
			this.provider as AbstractProvider
		)

		if (typeof orderbookProvider === 'string') {
			this.orderbookProvider = new JsonRpcProvider(orderbookProvider as string)
			this.orderbookProviderCredentials = { rpcUrl: orderbookProvider }
		} else if (orderbookProvider) {
			this.orderbookProvider = orderbookProvider
			this.orderbookProviderCredentials = { provider: orderbookProvider }
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
			orderbookPrivateKey,
			orderbookPhrase,
			orderbookSigner,
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

		if (this.signer) {
			this.signerAddress = await this.signer.getAddress()
		}

		if (orderbookSigner) {
			this.orderbookSigner = orderbookSigner
		} else if (orderbookPrivateKey) {
			const _privateKey = orderbookPrivateKey.startsWith('0x')
				? orderbookPrivateKey
				: `0x${orderbookPrivateKey}`
			this.orderbookSigner = new Wallet(_privateKey, this.orderbookProvider)
			this.orderbookSignerCredentials = { privateKey: orderbookPrivateKey }
		} else if (orderbookPhrase) {
			this.orderbookSigner = Wallet.fromPhrase(
				orderbookPhrase,
				this.orderbookProvider
			)
			this.orderbookSignerCredentials = { phrase: orderbookPhrase }
		} else if (this.orderbookProvider instanceof JsonRpcProvider) {
			try {
				this.orderbookSigner = await this.orderbookProvider.getSigner()
			} catch (e) {}
		}

		if (this.orderbookSigner) {
			this.orderbookSignerAddress = await this.orderbookSigner.getAddress()
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
			orderbookPrivateKey,
			orderbookPhrase,
			orderbookSigner,
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
				this.provider.getSigner().then((signer) => {
					this.signer = signer
				})
			} catch (e) {}
		}

		if (this.signer) {
			this.signer.getAddress().then((signerAddress) => {
				this.signerAddress = signerAddress
			})
		}

		if (orderbookSigner) {
			this.orderbookSigner = orderbookSigner
		} else if (orderbookPrivateKey) {
			const _privateKey = orderbookPrivateKey.startsWith('0x')
				? orderbookPrivateKey
				: `0x${orderbookPrivateKey}`
			this.orderbookSigner = new Wallet(_privateKey, this.orderbookProvider)
			this.orderbookSignerCredentials = { privateKey: orderbookPrivateKey }
		} else if (orderbookPhrase) {
			this.orderbookSigner = Wallet.fromPhrase(
				orderbookPhrase,
				this.orderbookProvider
			)
			this.orderbookSignerCredentials = { phrase: orderbookPhrase }
		} else if (this.orderbookProvider instanceof JsonRpcProvider) {
			try {
				this.orderbookProvider.getSigner().then((orderbookSigner) => {
					this.orderbookSigner = orderbookSigner
				})
			} catch (e) {}
		}

		if (this.orderbookSigner) {
			this.orderbookSigner.getAddress().then((orderbookSignerAddress) => {
				this.orderbookSignerAddress = orderbookSignerAddress
			})
		}
	}

	/**
	 * @param factoryAddress - {@link PremiaConfig.poolFactoryAddress}
	 */
	setPoolFactoryAddress(factoryAddress: string) {
		this.contracts.setPoolFactoryAddress(factoryAddress)
	}

	/**
	 * @param diamondAddress - {@link PremiaConfig.poolDiamondAddress}
	 */
	setPoolDiamondAddress(diamondAddress: string) {
		this.contracts.setPoolDiamondAddress(diamondAddress)
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
		this.options.cancelAllStreams()
		this.cancelAllEventStreams()
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
			orderbookProvider:
				this.orderbookProviderCredentials?.provider ??
				this.orderbookProviderCredentials?.rpcUrl,
			privateKey: this.signerCredentials?.privateKey,
			phrase: this.signerCredentials?.phrase,
			orderbookPrivateKey: this.orderbookSignerCredentials?.privateKey,
			orderbookPhrase: this.orderbookSignerCredentials?.phrase,
			subgraphUri: this.subgraph.uri,
			skipSubgraph: this.skipSubgraph,
			apiKey: this.apiKey,
			apiBaseUri: this.apiBaseUri,
			apiWsUri: this.apiWsUri,
			coingeckoBaseUri: this.coingeckoBaseUri,
			coingeckoProApiKey: this.coingeckoProApiKey,
			orderbookAddress: this.contracts.orderbookAddress,
			poolFactoryAddress: this.contracts.poolFactoryAddress,
			poolDiamondAddress: this.contracts.poolDiamondAddress,
			vaultRegistryAddress: this.contracts.vaultRegistryAddress,
			userSettingsAddress: this.contracts.userSettingsAddress,
		}
	}
}

export default Premia
