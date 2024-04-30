import { DefaultOptions } from '@apollo/client/core'
import { parseBigInt } from './utils'

import {
	arbitrum,
	arbitrumGoerli,
	arbitrumNova,
} from '@premia/v3-abi/deployment'

export enum SupportedChainId {
	// Testnet,
	ARBITRUM_GOERLI = 421613,
	ARBITRUM = 42161,
	ARBITRUM_NOVA = 42170,
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
		WETH: arbitrum.tokens.WETH,
		WBTC: arbitrum.tokens.WBTC,
		PREMIA: arbitrum.tokens.PREMIA,
		USDC: arbitrum.tokens.USDC,
		POOL_DIAMOND: arbitrum.core.PremiaDiamond.address,
		POOL_FACTORY: arbitrum.core.PoolFactoryProxy.address,
		ORDERBOOK: arbitrum.core.OrderbookStream.address,
		CHAINLINK_ORACLE_ADAPTER: arbitrum.core.ChainlinkAdapterProxy.address,
		DEFAULT_REFERRER: '0x3e4906976Cd967c99FbF0B32823e59aB96DDBE3F',
		ERC20_ROUTER: arbitrum.core.ERC20Router.address,
		USER_SETTINGS: arbitrum.core.UserSettingsProxy.address,
		VAULT_REGISTRY: arbitrum.core.VaultRegistryProxy.address,
		VOLATILITY_ORACLE: arbitrum.core.VolatilityOracleProxy.address,
		VX_PREMIA: arbitrum.core.VxPremiaProxy.address,
		VAULT_MINING: arbitrum.core.VaultMiningProxy.address,
		REFERRAL: arbitrum.core.ReferralProxy.address,
		OPTION_REWARD: arbitrum.optionReward['PREMIA/USDC'].address,
	},
	[SupportedChainId.ARBITRUM_NOVA]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		ORDERBOOK: arbitrumNova.core.OrderbookStream.address,
	},
	[SupportedChainId.ARBITRUM_GOERLI]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		TEST_WETH: arbitrumGoerli.tokens.testWETH,
		WETH: arbitrumGoerli.tokens.WETH,
		WBTC: arbitrumGoerli.tokens.WBTC,
		PREMIA: arbitrumGoerli.tokens.PREMIA,
		USDC: arbitrumGoerli.tokens.USDC,
		POOL_DIAMOND: arbitrumGoerli.core.PremiaDiamond.address,
		POOL_FACTORY: arbitrumGoerli.core.PoolFactoryProxy.address,
		ORDERBOOK: arbitrumGoerli.core.OrderbookStream.address,
		CHAINLINK_ORACLE_ADAPTER: arbitrumGoerli.core.ChainlinkAdapterProxy.address,
		DEFAULT_REFERRER: '0x3e4906976Cd967c99FbF0B32823e59aB96DDBE3F',
		ERC20_ROUTER: arbitrumGoerli.core.ERC20Router.address,
		USER_SETTINGS: arbitrumGoerli.core.UserSettingsProxy.address,
		VAULT_REGISTRY: arbitrumGoerli.core.VaultRegistryProxy.address,
		VOLATILITY_ORACLE: arbitrumGoerli.core.VolatilityOracleProxy.address,
		VX_PREMIA: arbitrumGoerli.core.VxPremiaProxy.address,
		VAULT_MINING: arbitrumGoerli.core.VaultMiningProxy.address,
	},
}

export const DefaultApolloClientOptions: DefaultOptions = {
	watchQuery: {
		fetchPolicy: 'no-cache',
		errorPolicy: 'ignore',
	},
	query: {
		fetchPolicy: 'no-cache',
		errorPolicy: 'ignore',
	},
}
