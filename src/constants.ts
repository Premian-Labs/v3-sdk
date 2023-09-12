import { DefaultOptions } from '@apollo/client/core'
import { parseBigInt } from './utils'

import arbitrumJson from './deployment/arbitrum.json'
import arbitrumGoerliJson from './deployment/arbitrumGoerli.json'
import arbitrumNovaJson from './deployment/arbitrumNova.json'

export enum SupportedChainId {
	// Testnet,
	ARBITRUM_GOERLI = 421613,
	ARBITRUM = 42161,
	ARBITRUM_NOVA = 42170,
}

export enum CacheTTL {
	DAILY = 86400,
	HOURLY = 3600,
	MINUTE = 60,
	SECOND = 1,
}

export const Fees = {
	PROTOCOL_FEE_PERCENT: BigInt(0.5e18), // 50%

	PREMIUM_FEE_PERCENT: BigInt(0.03e18), // 3%
	NOTIONAL_FEE_PERCENT: BigInt(0.003e18), // 0.3%
	ORDERBOOK_NOTIONAL_FEE_PERCENT: BigInt(0.0008e18), // 0.08%
	MAX_PREMIUM_FEE_PERCENT: BigInt(0.125e18), // 12.5%

	EXERCISE_NOTIONAL_FEE_PERCENT: BigInt(0.003e18), // 0.3%
	MAX_EXERCISE_FEE_PERCENT: BigInt(0.125e18), // 12.5%
}

export const WAD_DECIMALS = 18n
export const USD_DECIMALS = 18n
export const ETH_DECIMALS = 18n

export const MIN_TICK_DISTANCE = parseBigInt('0.001')
export const MIN_TICK_PRICE = parseBigInt('0.001')
export const MAX_TICK_PRICE = parseBigInt('1')

export const WAD_BI = parseBigInt('1')
export const ONE_BI = 1n
export const ZERO_BI = 0n

export const CHAINLINK_BTC = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
export const CHAINLINK_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
export const CHAINLINK_USD = '0x0000000000000000000000000000000000000348'

export interface AddressMap {
	[chainId: number]: {
		[contractName: string]: string
	}
}

export const Addresses: AddressMap = {
	[SupportedChainId.ARBITRUM]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		WETH: arbitrumJson.tokens.WETH,
		WBTC: arbitrumJson.tokens.WBTC,
		PREMIA: arbitrumJson.tokens.PREMIA,
		USDC: arbitrumJson.tokens.USDC,
		POOL_DIAMOND: arbitrumJson.PremiaDiamond.address,
		POOL_FACTORY: arbitrumJson.PoolFactoryProxy.address,
		ORDERBOOK: arbitrumJson.OrderbookStream.address,
		CHAINLINK_ORACLE_ADAPTER: arbitrumJson.ChainlinkAdapterProxy.address,
		DEFAULT_REFERRER: '0x3e4906976Cd967c99FbF0B32823e59aB96DDBE3F',
		ERC20_ROUTER: arbitrumJson.ERC20Router.address,
		USER_SETTINGS: arbitrumJson.UserSettingsProxy.address,
		VAULT_REGISTRY: arbitrumJson.VaultRegistryProxy.address,
		VOLATILITY_ORACLE: arbitrumJson.VolatilityOracleProxy.address,
		VX_PREMIA: arbitrumJson.VxPremiaProxy.address,
		VAULT_MINING: arbitrumJson.VaultMiningProxy.address,
		REFERRAL: arbitrumJson.ReferralProxy.address,
	},
	[SupportedChainId.ARBITRUM_NOVA]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		ORDERBOOK: arbitrumNovaJson.OrderbookStream.address,
	},
	[SupportedChainId.ARBITRUM_GOERLI]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		TEST_WETH: arbitrumGoerliJson.tokens.testWETH,
		WETH: arbitrumGoerliJson.tokens.WETH,
		WBTC: arbitrumGoerliJson.tokens.WBTC,
		PREMIA: arbitrumGoerliJson.tokens.PREMIA,
		USDC: arbitrumGoerliJson.tokens.USDC,
		POOL_DIAMOND: arbitrumGoerliJson.PremiaDiamond.address,
		POOL_FACTORY: arbitrumGoerliJson.PoolFactoryProxy.address,
		ORDERBOOK: arbitrumGoerliJson.OrderbookStream.address,
		CHAINLINK_ORACLE_ADAPTER: arbitrumGoerliJson.ChainlinkAdapterProxy.address,
		DEFAULT_REFERRER: '0x3e4906976Cd967c99FbF0B32823e59aB96DDBE3F',
		ERC20_ROUTER: arbitrumGoerliJson.ERC20Router.address,
		USER_SETTINGS: arbitrumGoerliJson.UserSettingsProxy.address,
		VAULT_REGISTRY: arbitrumGoerliJson.VaultRegistryProxy.address,
		VOLATILITY_ORACLE: arbitrumGoerliJson.VolatilityOracleProxy.address,
		VX_PREMIA: arbitrumGoerliJson.VxPremiaProxy.address,
		VAULT_MINING: arbitrumGoerliJson.VaultMiningProxy.address,
	},
}

export const DefaultApolloClientOptions: DefaultOptions = {
	watchQuery: {
		fetchPolicy: 'no-cache',
	},
	query: {
		fetchPolicy: 'no-cache',
		errorPolicy: 'all',
	},
}
