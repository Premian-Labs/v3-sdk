import { BigNumberish, parseEther } from 'ethers'
import moment from 'moment'
import { expect } from 'chai'

import {
	Addresses,
	IPoolFactory__factory,
	Premia,
	SupportedChainId,
} from '../../src'

const dotenv = require('dotenv')
dotenv.config()

interface PoolKey {
	base: string
	quote: string
	oracleAdapter: string
	strike: BigNumberish
	maturity: BigNumberish
	isCallPool: boolean
}

describe('ContractsAPI', function (this: any) {
	const privateKey = process.env.TESTNET_PRIVATE_KEY
	const provider = process.env.PROVIDER

	this.timeout(30000)

	it('should have the constants set to proper values', async () => {
		const premia = await Premia.initialize({
			provider: provider,
			privateKey: privateKey,
			chainId: SupportedChainId.ARBITRUM_GOERLI,
		})

		expect(premia.contracts.orderbookAddress).eq(
			Addresses[SupportedChainId.ARBITRUM_NOVA].ORDERBOOK
		)
		expect(premia.contracts.vaultRegistryAddress).eq(
			Addresses[SupportedChainId.ARBITRUM_GOERLI].VAULT_REGISTRY
		)
		expect(premia.contracts.poolFactoryAddress).eq(
			Addresses[SupportedChainId.ARBITRUM_GOERLI].POOL_FACTORY
		)
	})

	it('should get the contract for the pool deployed in the setup', async () => {
		const premia = await Premia.initialize({
			useTestnet: true,
			privateKey: privateKey,
			provider: 'http://127.0.0.1:8545',
		})

		// Deploy a pool
		const poolFactory = await IPoolFactory__factory.connect(
			premia.contracts.poolFactoryAddress,
			premia.signer
		)

		const maturity = moment()
			.utcOffset(0)
			.add(7, 'd')
			.day(5)
			.set({ hour: 8, minute: 0, second: 0, millisecond: 0 })
		const maturitySec = maturity.valueOf() / 1000

		const strike = 1800
		const poolKey: PoolKey = {
			base: Addresses[premia.chainId].WETH,
			quote: Addresses[premia.chainId].USDC,
			oracleAdapter: Addresses[premia.chainId].CHAINLINK_ORACLE_ADAPTER,
			strike: parseEther(strike.toString()),
			maturity: maturitySec,
			isCallPool: true,
		}

		let [poolAddress, isDeployed] = await poolFactory.getPoolAddress(poolKey)

		if (!isDeployed) {
			const tx = await poolFactory.deployPool(poolKey, {
				value: parseEther('2'), //init fee. excess refunded
				gasLimit: 10000000, // Fails to properly estimate gas limit
			})
			await premia.provider.waitForTransaction(tx.hash, 1)
			;[poolAddress] = await poolFactory.getPoolAddress(poolKey)
		}

		let pool = premia.contracts.getPoolContract(poolAddress, premia.provider)

		expect(await pool.getAddress()).eq(poolAddress)
	})

	it('should get the token contract for WETH', async () => {
		const premia = await Premia.initialize({
			useTestnet: true,
			privateKey: privateKey,
			provider: 'http://127.0.0.1:8545',
		})

		let base = premia.contracts.getTokenContract(
			Addresses[premia.chainId].WETH,
			premia.provider
		)

		expect(await base.name()).eq('Wrapped Ether')
		expect(await base.decimals()).eq(18n)
	})

	it('should get the contract for the chainlink oracle adapter', async () => {
		const premia = await Premia.initialize({
			privateKey: privateKey,
			provider: 'http://127.0.0.1:8545',
			chainId: SupportedChainId.ARBITRUM_GOERLI,
		})

		let oracleAdapter = premia.contracts.getOracleAdapterContract(
			Addresses[premia.chainId].CHAINLINK_ORACLE_ADAPTER,
			premia.provider
		)

		expect(await oracleAdapter.getAddress()).eq(
			Addresses[premia.chainId].CHAINLINK_ORACLE_ADAPTER
		)
	})

	it('should get the contract for the pool factory', async () => {
		const premia = await Premia.initialize({
			privateKey: privateKey,
			provider: 'http://127.0.0.1:8545',
			chainId: SupportedChainId.ARBITRUM_GOERLI,
		})

		let poolFactory = premia.contracts.getPoolFactoryContract(premia.provider)

		expect(await poolFactory.getAddress()).eq(
			Addresses[premia.chainId].POOL_FACTORY
		)
	})

	it('should get the contract for the order book', async () => {
		const premia = await Premia.initialize({
			privateKey: privateKey,
			provider: 'http://127.0.0.1:8545',
			chainId: SupportedChainId.ARBITRUM_GOERLI,
		})

		let orderboook = premia.contracts.getOrderbookContract(premia.novaProvider)

		expect(await orderboook.getAddress()).eq(
			Addresses[SupportedChainId.ARBITRUM_NOVA].ORDERBOOK
		)
	})
})
