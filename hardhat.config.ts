import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'

import Dotenv from 'dotenv'

Dotenv.config()

const {
	API_KEY_ALCHEMY,
	PKEY_ETH_MAIN,
	PKEY_ETH_TEST,
	CACHE_PATH,
	API_KEY_INFURA,
} = process.env

// As the PKEYs are only used for deployment, we use default dummy PKEYs if none are set in .env file, so that project can compile
const pkeyMainnet =
	PKEY_ETH_MAIN == undefined || PKEY_ETH_MAIN.length == 0
		? 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
		: PKEY_ETH_MAIN
const pkeyTestnet =
	PKEY_ETH_TEST == undefined || PKEY_ETH_TEST.length == 0
		? 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
		: PKEY_ETH_TEST

export default {
	solidity: {
		compilers: [
			{
				version: '0.8.19',
				settings: {
					viaIR: false,
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		],
		overrides: {
			'contracts/staking/VxPremia.sol': {
				version: '0.8.19',
				settings: {
					viaIR: true,
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		},
	},

	paths: {
		cache: CACHE_PATH ?? './cache',
	},

	networks: {
		hardhat: {
			forking: {
				url: `https://eth-mainnet.alchemyapi.io/v2/${API_KEY_ALCHEMY}`,
				blockNumber: 16597500,
			},
			blockGasLimit: 180000000000,
		},
		anvil: {
			url: `http://127.0.0.1:8545`,
			accounts: [pkeyTestnet],
		},
		arbitrum: {
			url: `https://arb-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}`,
			accounts: [pkeyMainnet],
			timeout: 300000,
		},
		arbitrumGoerli: {
			url: `https://arbitrum-goerli.infura.io/v3/${API_KEY_INFURA}`,
			accounts: [pkeyTestnet],
			timeout: 300000,
		},
		goerli: {
			url: `https://eth-goerli.alchemyapi.io/v2/${API_KEY_ALCHEMY}`,
			accounts: [pkeyTestnet],
			timeout: 300000,
		},
		arbitrumNova: {
			url: `https://nova.arbitrum.io/rpc`,
			accounts: [pkeyMainnet],
			timeout: 300000,
		},
	},

	mocha: {
		timeout: 6000000,
	},
}
