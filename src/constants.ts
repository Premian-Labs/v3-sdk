import { DefaultOptions } from '@apollo/client/core'
import { parseBigInt } from './utils'

export enum SupportedChainId {
	// Testnet,
	GOERLI = 5,
	ARBITRUM_GOERLI = 421613,
	HARDHAT = 31337,

	ARBITRUM = 42161,
	ARBITRUM_NOVA = 42170,
}

export enum CacheTTL {
	DAILY = 86400,
	HOURLY = 3600,
	MINUTE = 60,
	SECOND = 1,
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
		WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		PREMIA: '0x51fC0f6660482Ea73330E414eFd7808811a57Fa2',
		USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
		VAULT_REGISTRY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
		VX_PREMIA: '0x3992690E5405b69d50812470B0250c878bFA9322',
	},

	[SupportedChainId.ARBITRUM_NOVA]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		ORDERBOOK: '0x7BAa39B8C2197B4C859D942F33AD2Fe6fe3050eE',
	},
	[SupportedChainId.GOERLI]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		ERC20ROUTER: '0x15547399A5Bfe5D751d359b52535BCBFaF0BDa54',
		TEST_WETH: '0xC2ECb8563800B523426c3328EeC1F7771D433C9c',
		WETH: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
		PREMIA: '0x9f5D1212514Ac88E26c523387C60F87B67AD1130',
		USDC: '0x16fA8D635311fc4DA9A2f8793EE016670b0C6Ed2',
		POOL_FACTORY: '0x840aCE9902d3CDe50d9c57ce8E2F324e165CfC66',
		ORDERBOOK: '0x54716D4cd0cC91737D858F0FBa8BE1cAFcC8C363',
		UNISWAP_CHAINLINK_ORACLE_ADAPTER:
			'0x912b88721A20D4aF284A2288942794199BC1a62c',
		CHAINLINK_ORACLE_ADAPTER: '0x62Bc6a93726413f924b2aaD110283FCE8E30339E',
		UNISWAP_ORACLE_ADAPTER: '0x609f59798095874c2Ed0c01F97AF56A1ff65748B',
		DEFAULT_REFERRER: '0x589155f2F38B877D7Ac3C1AcAa2E42Ec8a9bb709',
		ERC20_ROUTER: '0x15547399A5Bfe5D751d359b52535BCBFaF0BDa54',
		USER_SETTINGS: '0xEDBC1B7e22bAf0Efc5Ed1A8a05d24014aA97BEC0',
		VAULT_REGISTRY: '0xBB7599c4772c75B908Efe35525b168f252a24505',
		VOLATILITY_ORACLE: '0x4DeE5A6cAefafc8cF6698A8Afe6e30BF7D1538e2',
	},
	[SupportedChainId.ARBITRUM_GOERLI]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		TEST_WETH: '0x671E34483Ec9f8100bdA058Cb5fEC44b0d848a90',
		WETH: '0x7F5bc2250ea57d8ca932898297b1FF9aE1a04999',
		WBTC: '0x33cABeb897eAC235c09704932BcBa6e12e3d3757',
		PREMIA: '0xC0A4ae47Aad883AAc349C15E6451BF767E7a775c',
		USDC: '0x743e16567929415b514Ece22bcC5F06507de513F',
		POOL_FACTORY: '0x0D3dd7d73CCd6Ba328DaB00eD0E1686F0114C560',
		ORDERBOOK: '0x4A6bF3a03458FAD82b7f4d89746D70EBf068e73F',
		UNISWAP_CHAINLINK_ORACLE_ADAPTER:
			'0xE527a697155207145Cc60CA41Ba3AE977FA3b781',
		CHAINLINK_ORACLE_ADAPTER: '0x4DeE5A6cAefafc8cF6698A8Afe6e30BF7D1538e2',
		UNISWAP_ORACLE_ADAPTER: '0x906A204B5fA880ab1818bB6ECFcA68C756D1C501',
		DEFAULT_REFERRER: '0x589155f2F38B877D7Ac3C1AcAa2E42Ec8a9bb709',
		ERC20_ROUTER: '0xB70c6cF05d704D2F92af2510c2c634439f46D4eb',
		USER_SETTINGS: '0x0FCb798080c3c5209190A77A2E399A14cB7B970f',
		VAULT_REGISTRY: '0xac27D22956bb8ee7299F77B409569bc04F8226C9',
		VOLATILITY_ORACLE: '0xBE464F3a7eFE0c97Ef905CFB1162CAffff1761f3',
		VX_PREMIA: '0xb049c147306e9AC6AA3a4eB1aE4A8e5f88dBf5a5',
	},
	[SupportedChainId.HARDHAT]: {
		CHAINLINK_BTC,
		CHAINLINK_ETH,
		CHAINLINK_USD,
		WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		PREMIA: '0x51fC0f6660482Ea73330E414eFd7808811a57Fa2',
		USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
		VAULT_REGISTRY: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
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
