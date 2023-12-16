import { Provider } from 'ethers'

import { Addresses, SupportedChainId } from '../constants'
import {
	IERC1155,
	IERC1155__factory,
	IERC4626,
	IERC4626__factory,
	IOracleAdapter,
	IOracleAdapter__factory,
	IPool,
	IPool__factory,
	IPoolFactory,
	IPoolFactory__factory,
	IReferral,
	IReferral__factory,
	IUserSettings,
	IUserSettings__factory,
	IVault,
	IVault__factory,
	IVaultMining,
	IVaultMining__factory,
	IVaultRegistry,
	IVaultRegistry__factory,
	IVxPremia,
	IVxPremia__factory,
	OrderbookStream,
	OrderbookStream__factory,
	ISolidStateERC20,
	ISolidStateERC20__factory,
	IOptionPS,
	IOptionPS__factory,
	IOptionReward,
	IOptionReward__factory,
	IDualMining,
	IDualMining__factory,
} from '@premia/v3-abi/typechain'
import { BaseAPI } from './baseAPI'

/**
 * The `ContractAPI` class extends `BaseAPI` and is used for interacting with various types of contracts pertaining to the Premia protocol.
 *
 * It includes methods for connecting to Pool, Token, Oracle Adapter, Pool Factory, Vault Registry, Vault, and Orderbook contracts.
 * The connection to the contracts is made using a `Provider`, which defaults to `premia.signer` or `premia.provider` if not provided.
 *
 * The class also includes methods for setting the addresses for the Orderbook, Pool Factory, and Vault Registry contracts.
 *
 * @property {string} orderbookAddress - The address of the Orderbook contract.
 * @property {string} vaultRegistryAddress - The address of the Vault Registry contract.
 * @property {string} poolFactoryAddress - The address of the Pool Factory contract.
 *
 * @extends {BaseAPI}
 */
export class ContractAPI extends BaseAPI {
	/**
	 * The address of the `OrderbookStream` contract.
	 */
	orderbookAddress: string = Addresses[SupportedChainId.ARBITRUM_NOVA].ORDERBOOK

	/**
	 * The address of the `VaultRegistry` contract.
	 */
	vaultRegistryAddress: string =
		Addresses[SupportedChainId.ARBITRUM].VAULT_REGISTRY

	/**
	 * The address of the `PoolFactory` contract.
	 */
	poolFactoryAddress: string = Addresses[SupportedChainId.ARBITRUM].POOL_FACTORY

	/**
	 * The address of the Premia Diamond `IPool` contract.
	 */
	poolDiamondAddress: string = Addresses[SupportedChainId.ARBITRUM].POOL_DIAMOND

	/**
	 * The address of the `UserSettings` contract.
	 */
	userSettingsAddress: string =
		Addresses[SupportedChainId.ARBITRUM].USER_SETTINGS

	/**
	 * The address of the `PremiaStaking` contract.
	 */
	stakingAddress: string = Addresses[SupportedChainId.ARBITRUM].STAKING

	/**
	 * The address of the `VxPremia` contract.
	 */
	vxPremiaAddress: string = Addresses[SupportedChainId.ARBITRUM].VX_PREMIA

	/**
	 * The address of the `VaultMining` contract.
	 */
	vaultMiningAddress: string = Addresses[SupportedChainId.ARBITRUM].VAULT_MINING

	/**
	 * The address of the `Referral` contract.
	 */
	referralAddress: string = Addresses[SupportedChainId.ARBITRUM].REFERRAL

	/**
	 * The address of the `OptionReward` contract.
	 */
	optionRewardAddress: string =
		Addresses[SupportedChainId.ARBITRUM].OPTION_REWARD

	/**
	 * Connects to a pool contract at a given address using a provider.
	 *
	 * This function uses the `IPool__factory` to connect to a pool contract on the blockchain.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} poolAddress - The address of the pool contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not specified, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IPool} The connected pool contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getPoolContract(poolAddress: string, provider?: Provider): IPool {
		return IPool__factory.connect(
			poolAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to a token contract at a given address using a provider.
	 *
	 * This function utilizes the `SolidStateERC20__factory` to connect to a token contract on the blockchain.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} tokenAddress - The address of the token contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function will default to using `this.premia.signer` or `this.premia.provider`.
	 * @return {SolidStateERC20} The connected token contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getTokenContract(
		tokenAddress: string,
		provider?: Provider
	): ISolidStateERC20 {
		return ISolidStateERC20__factory.connect(
			tokenAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to an Oracle Adapter contract at a given address using a provider.
	 *
	 * This function leverages the `IOracleAdapter__factory` to connect to an Oracle Adapter contract on the blockchain.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} oracleAdapterAddress - The address of the Oracle Adapter contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IOracleAdapter} The connected Oracle Adapter contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getOracleAdapterContract(
		oracleAdapterAddress: string,
		provider?: Provider
	): IOracleAdapter {
		return IOracleAdapter__factory.connect(
			oracleAdapterAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the Pool Factory contract using a provider.
	 *
	 * This function utilizes the `IPoolFactory__factory` to connect to the Pool Factory contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IPoolFactory} The connected Pool Factory contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getPoolFactoryContract(provider?: Provider): IPoolFactory {
		return IPoolFactory__factory.connect(
			this.poolFactoryAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the Pool Diamond contract using a provider.
	 *
	 * This function utilizes the `IPool__factory` to connect to the Pool Diamond contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IPool} The connected Pool Diamond contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getPoolDiamondContract(provider?: Provider): IPool {
		return IPool__factory.connect(
			this.poolDiamondAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the Vault Registry contract using a provider.
	 *
	 * This function utilizes the `IVaultRegistry__factory` to connect to the Vault Factory contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IVaultRegistry} The connected Vault Factory contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getVaultRegistryContract(provider?: Provider): IVaultRegistry {
		return IVaultRegistry__factory.connect(
			this.vaultRegistryAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to a Vault contract at a given address using a provider.
	 *
	 * This function utilizes the `IVault__factory` to connect to a Vault contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} vaultAddress - The address of the Vault contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IVault} The connected Vault contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getVaultContract(vaultAddress: string, provider?: Provider): IVault {
		return IVault__factory.connect(
			vaultAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to an ERC4626 contract using a provider.
	 *
	 * This function leverages the `ERC4626__factory` to connect to a ERC4626 contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} vaultAddress - The address of the Vault contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IERC4626} The connected ERC4626 contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getERC4626Contract(vaultAddress: string, provider?: Provider): IERC4626 {
		return IERC4626__factory.connect(
			vaultAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to an ERC1155 contract using a provider.
	 *
	 * This function leverages the `ERC1155__factory` to connect to a ERC1155 contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} poolAddress - The address of the pool contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IERC1155} The connected ERC1155 contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getERC1155Contract(poolAddress: string, provider?: Provider): IERC1155 {
		return IERC1155__factory.connect(
			poolAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the Orderbook contract using a provider.
	 *
	 * This function leverages the `OrderbookStream__factory` to connect to the Orderbook contract.
	 * If no provider is specified, it will default to using the orderbookSigner or orderbookProvider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.orderbookSigner` or `this.premia.orderbookProvider`.
	 * @return {OrderbookStream} The connected Orderbook contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getOrderbookContract(provider?: Provider): OrderbookStream {
		return OrderbookStream__factory.connect(
			this.orderbookAddress,
			provider ?? (this.premia.orderbookSigner || this.premia.orderbookProvider)
		)
	}

	/**
	 * Connects to the UserSettings contract using a provider.
	 *
	 * This function leverages the `UserSettings__factory` to connect to the UserSettings contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IUserSettings} The connected UserSettings contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getUserSettingsContract(provider?: Provider): IUserSettings {
		return IUserSettings__factory.connect(
			this.userSettingsAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the VxPremia contract using a provider.
	 *
	 * This function leverages the `VxPremia __factory` to connect to the VxPremia contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IVxPremia} The connected VxPremia contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getVxPremiaContract(provider?: Provider): IVxPremia {
		return IVxPremia__factory.connect(
			this.vxPremiaAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the Referral contract using a provider.
	 *
	 * This function leverages the `VxPremia __factory` to connect to the VxPremia contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IReferral} The connected VxPremia contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getReferralContract(provider?: Provider): IReferral {
		return IReferral__factory.connect(
			this.referralAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the VxPremia contract using a provider.
	 *
	 * This function leverages the `VxPremia __factory` to connect to the VxPremia contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IVaultMining} The connected VxPremia contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getVaultMiningContract(provider?: Provider): IVaultMining {
		return IVaultMining__factory.connect(
			this.vaultMiningAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to the VxPremia contract using a provider.
	 *
	 * This function leverages the `OptionReward __factory` to connect to the OptionReward contract.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {Provider} [provider] - The provider to use for the connection. If not provided, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IOptionReward} The connected OptionReward contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getOptionRewardContract(provider?: Provider): IOptionReward {
		return IOptionReward__factory.connect(
			this.optionRewardAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to a optionPS contract at a given address using a provider.
	 *
	 * This function uses the `IOptionPS__factory` to connect to the OptionPS contract on the blockchain.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} optionPSAddress - The address of the OptionPS contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not specified, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IOptionPS} The connected optionPS contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getOptionPSContract(optionPSAddress: string, provider?: Provider): IOptionPS {
		return IOptionPS__factory.connect(
			optionPSAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Connects to a optionPS contract at a given address using a provider.
	 *
	 * This function uses the `IDualMining__factory` to connect to the dual mining contract on the blockchain.
	 * If no provider is specified, it will default to using the signer or provider from the `premia` object.
	 *
	 * @param {string} dualMiningAddress - The address of the dual mining contract to connect to.
	 * @param {Provider} [provider] - The provider to use for the connection. If not specified, the function defaults to using `this.premia.signer` or `this.premia.provider`.
	 * @return {IDualMining} The connected dual mining contract instance.
	 * @throws Will throw an error if the connection to the contract fails.
	 */
	getDualMiningContract(
		dualMiningAddress: string,
		provider?: Provider
	): IDualMining {
		return IDualMining__factory.connect(
			dualMiningAddress,
			provider ?? this.premia.signer ?? this.premia.provider
		)
	}

	/**
	 * Sets the orderbook contract address used for this instance.
	 *
	 * @param {string} orderbookAddress - The address of the OrderbookStream contract.
	 */
	setOrderbookAddress(orderbookAddress: string): void {
		this.orderbookAddress = orderbookAddress
	}

	/**
	 * Sets the pool factory contract address used for this instance.
	 *
	 * @param {string} factoryAddress - The address of the PoolFactory contract.
	 */
	setPoolFactoryAddress(factoryAddress: string): void {
		this.poolFactoryAddress = factoryAddress
	}

	/**
	 * Sets the pool diamond contract address used for this instance.
	 *
	 * @param {string} diamondAddress - The address of the PremiaDiamond contract.
	 */
	setPoolDiamondAddress(diamondAddress: string): void {
		this.poolDiamondAddress = diamondAddress
	}

	/**
	 * Sets the vault registry contract address used for this instance.
	 *
	 * @param {string} registryAddress - The address of the VaultRegistry contract.
	 */
	setVaultRegistryAddress(registryAddress: string): void {
		this.vaultRegistryAddress = registryAddress
	}

	/**
	 * Sets the user settings contract address used for this instance.
	 *
	 * @param {string} userSettings - The address of the UserSettings contract.
	 */
	setUserSettingsAddress(userSettings: string): void {
		this.userSettingsAddress = userSettings
	}

	/**
	 * Sets the vxPremia contract address used for this instance.
	 *
	 * @param {string} vxPremiaAddress - The address of the VxPremia contract.
	 */
	setVxPremiaAddress(vxPremiaAddress: string): void {
		this.vxPremiaAddress = vxPremiaAddress
	}

	/**
	 * Sets the VaultMining contract address used for this instance.
	 *
	 * @param {string} vaultMiningAddress - The address of the VaultMining contract.
	 */
	setVaultMiningAddress(vaultMiningAddress: string): void {
		this.vaultMiningAddress = vaultMiningAddress
	}
}

export default ContractAPI
