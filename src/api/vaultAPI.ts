import {
	BigNumberish,
	ContractTransaction,
	ContractTransactionResponse,
	FixedNumber,
	toBigInt,
	ZeroAddress,
} from 'ethers'

import { withCache } from '../cache'
import { CacheTTL, WAD_BI, WAD_DECIMALS, ZERO_BI } from '../constants'
import {
	FillableQuote,
	PoolKey,
	Token,
	Vault,
	VaultExtended,
	VaultPosition,
	VaultPositionExtended,
} from '../entities'
import { BaseAPI } from './baseAPI'
import { convertDecimals, formatBigInt, sendTransaction } from '../utils'

export class VaultAPI extends BaseAPI {
	/**
	 * Converts a boolean into the corresponding `bigint` for the trade side.
	 *
	 * @param {boolean} isBuy - Whether the trade is a buy or a sell.
	 * @returns {bigint} The corresponding `bigint` for the trade side
	 */
	tradeSide(isBuy: boolean): bigint {
		return isBuy ? 0n : 1n
	}

	/**
	 * Converts a boolean into the corresponding `bigint` for the option type.
	 *
	 * @param {boolean} isCall - Whether the trade is a call or a put.
	 * @returns {bigint} The corresponding `bigint` for the trade side
	 */
	optionType(isCall: boolean): bigint {
		return isCall ? 0n : 1n
	}

	/**
	 * Returns the total amount of assets in a vault.
	 * @param vaultAddress {string} The contract address of the vault.
	 * @returns {Promise<bigint>} Promise containing the total assets in the vault.
	 */
	totalAssets(vaultAddress: string): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.totalAssets()
	}

	/**
	 * Returns the utilization percent of total assets in a vault.
	 * @param vaultAddress {string} The contract address of the vault.
	 * @returns {Promise<bigint>} Promise containing the utilization percent of the assets in the vault.
	 */
	async getUtilizationPercent(vaultAddress: string): Promise<number> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		const [_totalAssets, asset] = await Promise.all([
			vaultContract.totalAssets(),
			vaultContract.asset(),
		])

		const tokenContract = this.premia.contracts.getTokenContract(asset)
		const [decimals, _remaining] = await Promise.all([
			tokenContract.decimals(),
			tokenContract.balanceOf(vaultAddress),
		])

		const totalAssets = FixedNumber.fromValue(_totalAssets, Number(decimals))
		const remaining = FixedNumber.fromValue(_remaining, Number(decimals))

		return 1 - remaining.div(totalAssets).toUnsafeFloat()
	}

	/**
	 * Returns the best vault quote for a given pool.
	 *
	 * @param {string} poolAddress - The address of the pool to stream quotes for.
	 * @param {string} size - The size of the quote to stream.
	 * @param {string} isBuy - Whether the quote is a buy quote.
	 * @param {string} minimumSize - The minimum size of the quote to stream. Only quotes with a size greater than or equal to this will be emitted.
	 * @param {string} referrer - The referrer address to use for the quote.
	 * @param {string} maxSlippagePercent - The maximum slippage percent to use for the quote.
	 *
	 * @returns {Promise<FillableQuote | null>} A promise that resolves to the best quote for the given pool.
	 */
	@withCache(CacheTTL.SECOND)
	async quote(
		poolAddress: string,
		size: BigNumberish,
		isBuy: boolean,
		minimumSize?: BigNumberish,
		referrer?: string,
		taker?: string,
		maxSlippagePercent?: BigNumberish
	): Promise<FillableQuote | null> {
		const _size = toBigInt(size)
		const _minimumSize = minimumSize ? toBigInt(minimumSize) : _size
		const vaultRegistry = this.premia.contracts.getVaultRegistryContract()

		const poolKey = await this.premia.pools.getPoolKeyFromAddress(poolAddress)
		const [_taker, vaults] = await Promise.all([
			taker ?? this.premia.signer?.getAddress() ?? ZeroAddress,
			vaultRegistry.getVaultsByFilter(
				[poolKey.isCallPool ? poolKey.base : poolKey.quote],
				this.tradeSide(!isBuy),
				this.optionType(poolKey.isCallPool)
			),
		])

		const quotes: (FillableQuote | null)[] = await Promise.all(
			vaults.map(async (_vault) => {
				const vault = this.premia.contracts.getVaultContract(_vault.vault)

				const supportedPairs = await vaultRegistry.getSupportedTokenPairs(
					_vault.vault
				)
				const isSupported = supportedPairs.some(
					(pair) =>
						pair.base === poolKey.base &&
						pair.quote === poolKey.quote &&
						pair.oracleAdapter === poolKey.oracleAdapter
				)

				if (!isSupported) return null

				const quote = await vault
					.getQuote(poolKey, _size, isBuy, _taker)
					.catch((err) => {
						console.error('Error getting vault quote', err)
						return null
					})

				if (!quote) return null

				/// @dev quote already includes the taker fee
				const premiumLimit = maxSlippagePercent
					? this.premia.pricing.premiumLimit(quote, maxSlippagePercent, isBuy)
					: quote

				const takerFee = await this.premia.pools.takerFee(
					poolAddress,
					_size,
					ZERO_BI,
					true,
					false,
					_taker
				)
				/// @dev remove the taker fee from the price, to be consistent with the other quotes
				const price = ((quote - takerFee) * WAD_BI) / _size

				return {
					poolKey,
					poolAddress,
					provider: _vault.vault,
					taker: _taker,
					price,
					size: _size,
					isBuy: !isBuy,
					deadline: toBigInt(Math.floor(new Date().getTime() / 1000) + 60 * 60),
					takerFee,
					to: _vault.vault,
					approvalTarget: _vault.vault,
					approvalAmount: premiumLimit,
					data: vault.interface.encodeFunctionData('trade', [
						poolKey,
						size,
						isBuy,
						premiumLimit,
						this.premia.pools.toReferrer(referrer),
					]),
				}
			})
		).catch((err) => {
			console.error('Error getting quotes', err)
			return []
		})

		return this.premia.pricing.best(
			quotes as FillableQuote[],
			size,
			_minimumSize
		) as FillableQuote
	}

	/**
	 * Opens a stream, which will emit a quote every time the best vault quote changes.
	 *
	 * @param {string} options.poolAddress - The address of the pool to stream quotes for.
	 * @param {Object} options - The options object.
	 * @param {BigNumberish} options.size - The size of the quote to stream.
	 * @param {boolean} options.isBuy - Whether the quote is a buy quote.
	 * @param {BigNumberish} options.minimumSize - The minimum size of the quote to stream. Only quotes with a size greater than or equal to this will be emitted.
	 * @param {string} callback - The callback to call when a new quote is emitted.
	 *
	 * @returns {Promise<void>} A promise that resolves when the quote stream has been started.
	 */
	async streamQuotes(
		options: {
			poolAddress: string
			size: BigNumberish
			isBuy: boolean
			minimumSize?: BigNumberish
			referrer?: string
			taker?: string
		},
		callback: (quote: FillableQuote | null) => void
	): Promise<void> {
		const poolKey = await this.premia.pools.getPoolKeyFromAddress(
			options.poolAddress
		)
		const vaults = await this.premia.contracts
			.getVaultRegistryContract()
			.getVaultsByFilter(
				[poolKey.base],
				this.tradeSide(!options.isBuy),
				this.optionType(poolKey.isCallPool)
			)

		try {
			const bestQuote = await this.quote(
				options.poolAddress,
				options.size,
				options.isBuy,
				options.minimumSize,
				options.referrer,
				options.taker
			)

			callback(bestQuote)
		} catch (err) {
			console.error('Error streaming vault quote: ', err)
			callback(null)
		}

		for (const _vault of vaults) {
			const vault = this.premia.contracts.getVaultContract(_vault.vault)

			vault.on(vault.filters.UpdateQuotes, async () => {
				try {
					const quote = await this.quote(
						options.poolAddress,
						options.size,
						options.isBuy,
						options.minimumSize,
						options.referrer,
						options.taker
					)
					callback(quote)
				} catch (err) {
					console.error('Error streaming vault quote: ', err)
					callback(null)
				}
			})
		}
	}

	/**
	 * Cancels a quote stream for a given parameter set.
	 *
	 * @param {string} assets - The vault assets for which to cancel quote streams on.
	 * @param {string} isCall - Whether the vault is a call vault.
	 * @param {string} isBuy - Whether the quote is a buy quote.
	 *
	 * @returns {Promise<void>} A promise that resolves when the quote stream has been cancelled.
	 */
	async cancelQuoteStream(
		assets: string[],
		isCall: boolean,
		isBuy: boolean
	): Promise<void> {
		const vaults = await this.premia.contracts
			.getVaultRegistryContract()
			.getVaultsByFilter(
				assets,
				this.tradeSide(!isBuy),
				this.optionType(isCall)
			)

		for (const _vault of vaults) {
			const vault = this.premia.contracts.getVaultContract(_vault.vault)
			vault.on(vault.filters.UpdateQuotes, async () => null)
		}
	}

	/**
	 * Retrieves information for a specific vault using its address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a daily period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} address - The address of the vault for which information should be retrieved.
	 *
	 * @returns {Promise<VaultExtended>} A promise that resolves to a VaultExtended object, containing information about
	 *                                   the vault at the specified address.
	 */
	@withCache(CacheTTL.DAILY)
	async getVault(address: string): Promise<Vault> {
		return this.premia.subgraph.getVault(address)
	}

	/**
	 * Retrieves extended information for a specific vault using its address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} address - The address of the vault for which extended information should be retrieved.
	 *
	 * @returns {Promise<VaultExtended>} A promise that resolves to a VaultExtended object, containing
	 *                                   detailed information about the vault at the specified address.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultExtended(address: string): Promise<VaultExtended> {
		return this.premia.subgraph.getVaultExtended(address)
	}

	/**
	 * Retrieves information for all vaults.
	 *
	 * This function is cached, meaning that if it is called multiple times within a daily period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing information
	 *                             about a vault.
	 */
	@withCache(CacheTTL.DAILY)
	async getAllVaultsExtended(): Promise<VaultExtended[]> {
		return this.premia.subgraph.getAllVaultsExtended()
	}

	/**
	 * Retrieves extended information for all vaults associated with a given token address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a daily period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} tokenAddress - The base token address for which vaults should be retrieved.
	 *
	 * @returns {Promise<Vault[]>} A promise that resolves to an array of Vault objects, each containing information
	 *                             about a vault associated with the given base address.
	 */
	@withCache(CacheTTL.DAILY)
	async getVaults(tokenAddress: string): Promise<Vault[]> {
		return this.premia.subgraph.getVaultsExtended(tokenAddress)
	}

	/**
	 * Retrieves information for all vaults associated with a given token address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} tokenAddress - The base token address for which vaults should be retrieved.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing
	 *                                     detailed information about a vault associated with the given base address.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultsExtended(tokenAddress: string): Promise<VaultExtended[]> {
		return this.premia.subgraph.getVaultsExtended(tokenAddress)
	}

	/**
	 * Retrieves information for all vaults associated with a given token.
	 *
	 * This function is cached, meaning that if it is called multiple times within a daily period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {Token} token - The token for which vaults should be retrieved.
	 * @param {boolean} isQuote - Optional parameter that indicates whether the token is a quote token. Default is false.
	 *
	 * @returns {Promise<Vault[]>} A promise that resolves to an array of Vault objects, each containing information
	 *                             about a vault associated with the given token.
	 */
	@withCache(CacheTTL.DAILY)
	async getVaultsForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<Vault[]> {
		return this.premia.subgraph.getVaultsForToken(token, isQuote)
	}

	/**
	 * Retrieves extended information for all vaults associated with a given token.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {Token} token - The token for which vaults should be retrieved.
	 * @param {boolean} isQuote - Optional parameter that indicates whether the token is a quote token. Default is false.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing
	 *                                     detailed information about a vault associated with the given token.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultsExtendedForToken(
		token: Token,
		isQuote: boolean = false
	): Promise<VaultExtended[]> {
		return this.premia.subgraph.getVaultsExtendedForToken(token, isQuote)
	}

	/**
	 * Retrieves the vault position for a specific owner and pool.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one-minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @param {string} vaultAddress - The address of the vault.
	 * @returns {Promise<VaultPosition>} A promise that resolves to a VaultPosition object containing details about the owner's position in the specified vault.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultPosition(
		owner: string,
		vaultAddress: string
	): Promise<VaultPosition> {
		return this.premia.subgraph.getVaultPosition(owner, vaultAddress)
	}

	/**
	 * Retrieves the extended vault position for a specific owner and pool.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one-minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @param {string} vaultAddress - The address of the vault.
	 * @returns {Promise<VaultPositionExtended>} A promise that resolves to a VaultPositionExtended object containing extended details about the owner's position in the specified vault.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultPositionExtended(
		owner: string,
		vaultAddress: string
	): Promise<VaultPositionExtended> {
		return this.premia.subgraph.getVaultPositionExtended(owner, vaultAddress)
	}

	/**
	 * Retrieves the vault positions for a specific owner.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one-minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @returns {Promise<VaultPosition>} A promise that resolves to an array of VaultPositionExtended objects, each containing
	 *                                   detailed information about a vault position associated with the given owner.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultPositionsExtendedForUser(
		owner: string
	): Promise<VaultPositionExtended[]> {
		return this.premia.subgraph.getVaultPositionsExtendedForUser(owner)
	}

	/**
	 * Gets the balance of shares for a specific owner in a vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the balance of shares for the specified owner in the specified vault.
	 */
	async balanceOfShares(vaultAddress: string, owner: string): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress
		)
		return vaultContract.balanceOf(owner)
	}

	/**
	 * Gets the balance of assets for a specific owner in a vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the balance of assets for the specified owner in the specified vault.
	 */
	async balanceOfAssets(vaultAddress: string, owner: string): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress
		)
		const shares = await vaultContract.balanceOf(owner)
		return vaultContract.convertToAssets(shares)
	}

	/**
	 * Converts a given amount of assets to shares for a specific vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} assets - The amount of assets to be converted.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the equivalent shares for the specified amount of assets in the specified vault.
	 */
	async convertToShares(
		vaultAddress: string,
		assets: BigNumberish
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress
		)
		return vaultContract.convertToShares(assets)
	}

	/**
	 * Converts a given amount of shares to assets for a specific vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} shares - The amount of shares to be converted.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the equivalent assets for the specified amount of shares in the specified vault.
	 */
	async convertToAssets(
		vaultAddress: string,
		shares: BigNumberish
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress
		)
		return vaultContract.convertToAssets(shares)
	}

	/**
	 * Encodes the deposit parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string} vaultAddress - The address of the vault where assets will be deposited.
	 * @param {Object} options - An object containing the parameters for the deposit operation.
	 * @param {BigNumberish} options.assets - The amount of assets to be deposited.
	 * @param {string} options.receiver - The address of the receiver whose assets will be deposited and shares will be received.
	 *
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the deposit operation.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address.
	 */
	async encodeDeposit(
		vaultAddress: string,
		{
			assets,
			receiver,
		}: {
			assets: BigNumberish
			receiver: string
		}
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.deposit.populateTransaction(assets, receiver)
	}

	/**
	 * Deposits specified assets into a vault from the receiver's address.
	 *
	 * @param {string} vaultAddress - The address of the vault into which the assets are to be deposited.
	 * @param {Object} options - An object containing deposit parameters.
	 * @param {BigNumberish} options.assets - The amount of assets to be deposited into the vault.
	 * @param {string} options.receiver - The address of the receiver whose assets will be deposited and shares will be received.
	 *
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a transaction response. This contains details of the transaction such as block number, transaction hash, etc.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address, or if the transaction fails to be sent.
	 */
	async deposit(
		vaultAddress: string,
		options: {
			assets: BigNumberish
			receiver: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress),
			this.encodeDeposit(vaultAddress, options),
			'encodeDeposit'
		)
	}

	/**
	 * Gets the maximum amount that can be withdrawn from a specified vault by a particular owner.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the maximum amount that can be withdrawn by the owner from the vault.
	 */
	async maxWithdraw(vaultAddress: string, owner: string): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.maxWithdraw(owner)
	}

	/**
	 * Previews the amount of shares that would be withdrawn for a given amount of assets from a specific vault.
	 *
	 * @method previewWithdraw
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} assets - The amount of assets for which to preview the withdrawal.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the amount of shares that would be withdrawn for the given assets amount.
	 */
	async previewWithdraw(
		vaultAddress: string,
		assets: BigNumberish
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.previewWithdraw(assets)
	}

	/**
	 * Encodes the withdrawal parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string} vaultAddress - The address of the vault from which assets will be withdrawn.
	 * @param {Object} options - An object containing the parameters for the withdrawal operation.
	 * @param {BigNumberish} options.assets - The amount of assets to be withdrawn.
	 * @param {string} options.receiver - The address of the receiver who will get the withdrawn assets.
	 * @param {string} options.owner - The address of the current owner of the assets.
	 *
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the withdrawal operation.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address.
	 */
	async encodeWithdraw(
		vaultAddress: string,
		{
			assets,
			receiver,
			owner,
		}: {
			assets: BigNumberish
			receiver: string
			owner: string
		}
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.withdraw.populateTransaction(assets, receiver, owner)
	}

	/**
	 * Withdraws specified assets from a vault and sends them to a receiver's address.
	 *
	 * @param {string} vaultAddress - The address of the vault from which the assets are to be withdrawn.
	 * @param {Object} options - An object containing withdrawal parameters.
	 * @param {BigNumberish} options.assets - The amount of assets to be withdrawn from the vault.
	 * @param {string} options.receiver - The address of the receiver to which the withdrawn assets will be sent.
	 * @param {string} options.owner - The address of the owner initiating the withdrawal. This should be the signer of the transaction.
	 *
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a transaction response. This contains details of the transaction such as block number, transaction hash etc.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address, or if the transaction fails to be sent.
	 */
	async withdraw(
		vaultAddress: string,
		options: {
			assets: BigNumberish
			receiver: string
			owner: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress),
			this.encodeWithdraw(vaultAddress, options),
			'encodeWithdraw'
		)
	}

	/**
	 * Gets the maximum amount of shares that can be redeemed by a particular owner from a specified vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the maximum amount of shares that can be redeemed by the owner from the vault.
	 */
	async maxRedeem(vaultAddress: string, owner: string): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.maxRedeem(owner)
	}

	/**
	 * Previews the amount of assets that would be received for a given amount of shares from a specific vault.
	 *
	 * @method previewRedeem
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} shares - The amount of shares for which to preview the redemption.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the amount of assets that would be received for the given shares amount.
	 */
	async previewRedeem(
		vaultAddress: string,
		shares: BigNumberish
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.previewRedeem(shares)
	}

	/**
	 * Encodes a transaction for redeeming shares from a vault.
	 *
	 * @method encodeRedeem
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {object} options - An object containing the parameters for redeeming shares.
	 * @param {BigNumberish} options.shares - The number of shares to redeem.
	 * @param {string} options.receiver - The address to receive the redeemed assets.
	 * @param {string} options.owner - The address of the owner of the shares.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a ContractTransaction that represents the encoded transaction for redeeming the shares.
	 */
	async encodeRedeem(
		vaultAddress: string,
		{
			shares,
			receiver,
			owner,
		}: {
			shares: BigNumberish
			receiver: string
			owner: string
		}
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(vaultAddress)
		return vaultContract.redeem.populateTransaction(shares, receiver, owner)
	}

	/**
	 * Redeems shares from a vault and sends the resulting assets to the specified receiver.
	 *
	 * @method redeem
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {object} options - An object containing the parameters for redeeming shares.
	 * @param {BigNumberish} options.shares - The number of shares to redeem.
	 * @param {string} options.receiver - The address to receive the redeemed assets.
	 * @param {string} options.owner - The address of the owner of the shares.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a ContractTransactionResponse which contains information about the transaction that redeemed the shares.
	 */
	async redeem(
		vaultAddress: string,
		options: {
			shares: BigNumberish
			receiver: string
			owner: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress),
			this.encodeRedeem(vaultAddress, options),
			'encodeRedeem'
		)
	}

	/**
	 * Retrieves the quote for a specified trade operation in a specific vault.
	 *
	 * @param {string} vaultAddress - The address of the vault where the quote will be retrieved from.
	 * @param {PoolKey} poolKey - The identifier for the pool from which the contracts are to be bought or sold.
	 * @param {BigNumberish} size - The number of contracts to be bought or sold.
	 * @param {boolean} isBuy - A boolean indicating whether this operation is a buy (true) or sell (false).
	 * @param {string} taker - The address of the user who would perform the trade.
	 *
	 * @returns {Promise<bigint>} A promise that resolves to a quote for the proposed trade operation.
	 *
	 * @throws Will throw an error if the vault contract is not found for the provided vault address.
	 */
	async getQuote(
		vaultAddress: string,
		poolKey: PoolKey,
		size: BigNumberish,
		isBuy: boolean,
		taker: string
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getVaultContract(
			vaultAddress
		)
		return vaultContract.getQuote(poolKey, size, isBuy, taker)
	}

	/**
	 * Encodes the trade parameters into a contract transaction that can be broadcasted to the provider network.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {Object} options - An object containing key trade options.
	 * @param {PoolKey} options.poolKey - The unique identifier for the liquidity pool involved in the trade.
	 * @param {BigNumberish} options.size - The number of contracts to be bought or sold.
	 * @param {boolean} options.isBuy - A boolean flag indicating whether the trade is a buy (true) or sell (false).
	 * @param {BigNumberish} options.premiumLimit - The maximum premium that the trader is willing to pay for the trade.
	 * @param {string} [options.referrer] - (Optional) The address of the referrer. If not provided, the referrer will default to a zero address.
	 *
	 * @returns {Promise<ContractTransaction>} A promise that resolves to an encoded contract transaction. This transaction can be signed and broadcasted to the provider network.
	 *
	 * @throws Will throw an error if the vault contract is not found for the provided vault address.
	 */
	async encodeTrade(
		vaultAddress: string,
		{
			poolKey,
			size,
			isBuy,
			premiumLimit,
			referrer,
		}: {
			poolKey: PoolKey
			size: BigNumberish
			isBuy: boolean
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getVaultContract(vaultAddress)
		return vaultContract.trade.populateTransaction(
			poolKey,
			size,
			isBuy,
			premiumLimit,
			this.premia.pools.toReferrer(referrer)
		)
	}

	/**
	 * Performs a trade operation in a specific vault on behalf of a user.
	 *
	 * @param {string} vaultAddress - The address of the vault where the trade operation will occur.
	 * @param {Object} options - An object containing trade parameters.
	 * @param {PoolKey} options.poolKey - The unique identifier for the liquidity pool involved in the trade.
	 * @param {BigNumberish} options.size - The number of contracts to be bought or sold.
	 * @param {boolean} options.isBuy - A boolean indicating whether this operation is a buy (true) or sell (false).
	 * @param {BigNumberish} options.premiumLimit - The maximum premium that the trader is willing to pay for the trade.
	 * @param {string} [options.referrer] - (Optional) The address of the user who referred this trade.
	 *
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a transaction response. This contains details of the transaction such as block number, transaction hash, etc.
	 *
	 * @throws Will throw an error if the vault contract is not found for the provided vault address, or if the transaction fails to be sent.
	 */
	async trade(
		vaultAddress: string,
		options: {
			poolKey: PoolKey
			size: BigNumberish
			isBuy: boolean
			premiumLimit: BigNumberish
			referrer?: string
		}
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVaultContract(vaultAddress),
			this.encodeTrade(vaultAddress, options),
			'encodeTrade'
		)
	}
}

export default VaultAPI
