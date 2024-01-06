import {
	BigNumberish,
	ContractTransaction,
	ContractTransactionResponse,
	FixedNumber,
	Provider,
	toBigInt,
	ZeroAddress,
} from 'ethers'

import { WAD_BI, ZERO_BI } from '../constants'
import {
	FillableQuote,
	PoolKey,
	TransactionData,
	Vault,
	VaultExtended,
	VaultPosition,
	VaultPositionExtended,
} from '../entities'
import { BaseAPI } from './baseAPI'
import { sendTransaction } from '../utils'
import { TokenOrAddress } from './tokenAPI'

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
	 * @param provider {Provider} The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise containing the total assets in the vault.
	 */
	totalAssets(vaultAddress: string, provider?: Provider): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		return vaultContract.totalAssets()
	}

	/**
	 * Returns the utilization percent of total assets in a vault.
	 * @param vaultAddress {string} The contract address of the vault.
	 * @param provider {Provider} The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise containing the utilization percent of the assets in the vault.
	 */
	async getUtilizationPercent(
		vaultAddress: string,
		provider?: Provider
	): Promise<number> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		const [_totalAssets, asset] = await Promise.all([
			vaultContract.totalAssets(),
			vaultContract.asset(),
		])

		const tokenContract = this.premia.contracts.getTokenContract(
			asset,
			provider ?? this.premia.multicallProvider
		)
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
	 * @param {string} taker - The taker address to use for the quote.
	 * @param {number} maxSlippagePercent - The maximum slippage percent to use for the quote.
	 * @param {boolean} showErrors - Whether to show errors in the console.
	 * @param {Provider} provider - The custom provider to use for this call.
	 *
	 * @returns {Promise<FillableQuote | null>} A promise that resolves to the best quote for the given pool.
	 */
	async quote(
		poolAddress: string,
		size: BigNumberish,
		isBuy: boolean,
		minimumSize?: BigNumberish,
		referrer?: string,
		taker?: string,
		maxSlippagePercent?: number,
		showErrors?: boolean,
		provider?: Provider,
		_vaults?: string[]
	): Promise<FillableQuote | null> {
		const _size = toBigInt(size)
		const _minimumSize = minimumSize ? toBigInt(minimumSize) : _size
		const vaultRegistry = this.premia.contracts.getVaultRegistryContract(
			provider ?? this.premia.multicallProvider
		)

		const poolKey = await this.premia.pools.getPoolKeyFromAddress(
			poolAddress,
			provider
		)
		const [_taker, vaults, pool] = await Promise.all([
			taker ?? this.premia.signer?.getAddress() ?? ZeroAddress,
			_vaults
				? _vaults.map((vault) => ({ vault }))
				: vaultRegistry.getVaultsByFilter(
						[poolKey.isCallPool ? poolKey.base : poolKey.quote],
						this.tradeSide(!isBuy),
						this.optionType(poolKey.isCallPool)
				  ),
			this.premia.pools.getPoolMinimal(poolAddress),
		])

		const quotes: (FillableQuote | null)[] = await Promise.all(
			vaults.map(async (_vault) => {
				const vault = this.premia.contracts.getVaultContract(
					_vault.vault,
					provider ?? this.premia.multicallProvider
				)

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
						if (showErrors) {
							console.error(
								'Error getting vault quote with args:',
								poolKey,
								_size,
								isBuy,
								_taker,
								err
							)
						}

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
					_taker,
					provider
				)
				/// @dev remove the taker fee from the price, to be consistent with the other quotes
				const price = ((quote - takerFee) * WAD_BI) / _size

				return {
					pool,
					poolKey,
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

		return this.premia.pricing.best(quotes, size, _minimumSize) as FillableQuote
	}

	/**
	 * Opens a stream, which will emit a quote every time the best vault quote changes.
	 *
	 * @param {string} options.poolAddress - The address of the pool to stream quotes for.
	 * @param {Object} options - The options object.
	 * @param {BigNumberish} options.size - The size of the quote to stream.
	 * @param {boolean} options.isBuy - Whether the quote is a buy quote.
	 * @param {BigNumberish} options.minimumSize - The minimum size of the quote to stream. Only quotes with a size greater than or equal to this will be emitted.
	 * @param {string} options.referrer - The referrer address to use for the quote.
	 * @param {string} options.taker - The taker address to use for the quote.
	 * @param {number} options.maxSlippagePercent - The maximum slippage percent to use for the quote.
	 * @param {boolean} options.showErrors - Whether to show errors in the console.
	 * @param {Provider} options.provider - The custom provider to use for this call.
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
			maxSlippagePercent?: number
			showErrors?: boolean
			provider?: Provider
		},
		callback: (quote: FillableQuote | null) => void
	): Promise<void> {
		const index = this.streamIndex

		const callbackIfNotStale = (
			quote: FillableQuote | null,
			interval?: NodeJS.Timer
		) => {
			if (this.streamIndex > index) {
				console.log('Stale.')
				clearInterval(interval)
				return
			}
			callback(quote)
		}

		const poolKey = await this.premia.pools.getPoolKeyFromAddress(
			options.poolAddress,
			options.provider
		)
		const vaultRegistry = this.premia.contracts.getVaultRegistryContract(
			options.provider ?? this.premia.multicallProvider
		)

		const vaults = (
			await vaultRegistry.getVaultsByFilter(
				[poolKey.isCallPool ? poolKey.base : poolKey.quote],
				this.tradeSide(!options.isBuy),
				this.optionType(poolKey.isCallPool)
			)
		).map((vault) => vault.vault)

		try {
			const bestQuote = await this.quote(
				options.poolAddress,
				options.size,
				options.isBuy,
				options.minimumSize,
				options.referrer,
				options.taker,
				options.maxSlippagePercent,
				options.showErrors,
				options.provider,
				vaults
			)

			callbackIfNotStale(bestQuote)
		} catch (err) {
			console.error('Error streaming vault quote: ', err)
			callbackIfNotStale(null)
		}

		/// @dev: Use timeout instead of listening for events, because
		///		  there are at least 3 different events that can lead to
		///		  a quote update.
		const interval = setInterval(async () => {
			try {
				const quote = await this.quote(
					options.poolAddress,
					options.size,
					options.isBuy,
					options.minimumSize,
					options.referrer,
					options.taker,
					options.maxSlippagePercent,
					options.showErrors,
					options.provider,
					vaults
				)
				callbackIfNotStale(quote, interval)
			} catch (err) {
				console.error('Error streaming vault quote: ', err)
				callbackIfNotStale(null, interval)
			}
		}, 15000)
	}

	/**
	 * Cancels a quote stream for a given parameter set.
	 *
	 * @param {string} assets - The vault assets for which to cancel quote streams on.
	 * @param {string} isCall - Whether the vault is a call vault.
	 * @param {string} isBuy - Whether the quote is a buy quote.
	 * @param {Provider} provider - The custom provider to use for this call.
	 *
	 * @returns {Promise<void>} A promise that resolves when the quote stream has been cancelled.
	 */
	async cancelQuoteStream(
		assets: string[],
		isCall: boolean,
		isBuy: boolean,
		provider?: Provider
	): Promise<void> {
		const vaults = await this.premia.contracts
			.getVaultRegistryContract(provider ?? this.premia.multicallProvider)
			.getVaultsByFilter(
				assets,
				this.tradeSide(!isBuy),
				this.optionType(isCall)
			)

		for (const _vault of vaults) {
			const vault = this.premia.contracts.getVaultContract(
				_vault.vault,
				provider
			)
			vault.on(vault.filters.UpdateQuotes, async () => null)
		}
	}

	/**
	 * Retrieves information for a specific vault using its address.
	 *
	 * @param {string} address - The address of the vault for which information should be retrieved.
	 *
	 * @returns {Promise<VaultExtended>} A promise that resolves to a VaultExtended object, containing information about
	 *                                   the vault at the specified address.
	 */
	async getVault(address: string): Promise<Vault> {
		return this.premia.subgraph.getVault(address)
	}

	/**
	 * Retrieves extended information for a specific vault using its address.
	 *
	 * @param {string} address - The address of the vault for which extended information should be retrieved.
	 *
	 * @returns {Promise<VaultExtended>} A promise that resolves to a VaultExtended object, containing
	 *                                   detailed information about the vault at the specified address.
	 */
	async getVaultExtended(address: string): Promise<VaultExtended> {
		return this.premia.subgraph.getVaultExtended(address)
	}

	/**
	 * Retrieves information for all vaults.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing information
	 *                             about a vault.
	 */
	async getAllVaultsExtended(): Promise<VaultExtended[]> {
		return this.premia.subgraph.getAllVaultsExtended()
	}

	/**
	 * Retrieves extended information for all vaults associated with a given token address.
	 *
	 * @param {string} tokenAddress - The base token address for which vaults should be retrieved.
	 *
	 * @returns {Promise<Vault[]>} A promise that resolves to an array of Vault objects, each containing information
	 *                             about a vault associated with the given base address.
	 */
	async getVaults(tokenAddress: string): Promise<Vault[]> {
		return this.premia.subgraph.getVaultsExtended(tokenAddress)
	}

	/**
	 * Retrieves information for all vaults associated with a given token address.
	 *
	 * @param {string} tokenAddress - The base token address for which vaults should be retrieved.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing
	 *                                     detailed information about a vault associated with the given base address.
	 */
	async getVaultsExtended(tokenAddress: string): Promise<VaultExtended[]> {
		return this.premia.subgraph.getVaultsExtended(tokenAddress)
	}

	/**
	 * Retrieves information for all vaults associated with a given token.
	 *
	 * @param {TokenOrAddress} token - The token or token address for which vaults should be retrieved.
	 * @param {boolean} isQuote - Optional parameter that indicates whether the token is a quote token. Default is false.
	 *
	 * @returns {Promise<Vault[]>} A promise that resolves to an array of Vault objects, each containing information
	 *                             about a vault associated with the given token.
	 */
	async getVaultsForToken(
		token: TokenOrAddress,
		isQuote: boolean = false
	): Promise<Vault[]> {
		return this.premia.subgraph.getVaultsForToken(token, isQuote)
	}

	/**
	 * Retrieves extended information for all vaults associated with a given token.
	 *
	 * @param {TokenOrAddress} token - The token or token address for which vaults should be retrieved.
	 * @param {boolean} isQuote - Optional parameter that indicates whether the token is a quote token. Default is false.
	 *
	 * @returns {Promise<VaultExtended[]>} A promise that resolves to an array of VaultExtended objects, each containing
	 *                                     detailed information about a vault associated with the given token.
	 */
	async getVaultsExtendedForToken(
		token: TokenOrAddress,
		isQuote: boolean = false
	): Promise<VaultExtended[]> {
		return this.premia.subgraph.getVaultsExtendedForToken(token, isQuote)
	}

	/**
	 * Retrieves the vault position for a specific owner and pool.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @param {string} vaultAddress - The address of the vault.
	 * @returns {Promise<VaultPosition>} A promise that resolves to a VaultPosition object containing details about the owner's position in the specified vault.
	 */
	async getVaultPosition(
		owner: string,
		vaultAddress: string
	): Promise<VaultPosition> {
		return this.premia.subgraph.getVaultPosition(owner, vaultAddress)
	}

	/**
	 * Retrieves the extended vault position for a specific owner and pool.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @param {string} vaultAddress - The address of the vault.
	 * @returns {Promise<VaultPositionExtended>} A promise that resolves to a VaultPositionExtended object containing extended details about the owner's position in the specified vault.
	 */
	async getVaultPositionExtended(
		owner: string,
		vaultAddress: string
	): Promise<VaultPositionExtended> {
		return this.premia.subgraph.getVaultPositionExtended(owner, vaultAddress)
	}

	/**
	 * Retrieves the vault positions for a specific owner.
	 *
	 * @param {string} owner - The address of an owner with shares in the vault.
	 * @returns {Promise<VaultPosition>} A promise that resolves to an array of VaultPositionExtended objects, each containing
	 *                                   detailed information about a vault position associated with the given owner.
	 */
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
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the balance of shares for the specified owner in the specified vault.
	 */
	async balanceOfShares(
		vaultAddress: string,
		owner: string,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		return vaultContract.balanceOf(owner)
	}

	/**
	 * Gets the balance of assets for a specific owner in a vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the balance of assets for the specified owner in the specified vault.
	 */
	async balanceOfAssets(
		vaultAddress: string,
		owner: string,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		const shares = await vaultContract.balanceOf(owner)
		return vaultContract.convertToAssets(shares)
	}

	/**
	 * Converts a given amount of assets to shares for a specific vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} assets - The amount of assets to be converted.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the equivalent shares for the specified amount of assets in the specified vault.
	 */
	async convertToShares(
		vaultAddress: string,
		assets: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		return vaultContract.convertToShares(assets)
	}

	/**
	 * Converts a given amount of shares to assets for a specific vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} shares - The amount of shares to be converted.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the equivalent assets for the specified amount of shares in the specified vault.
	 */
	async convertToAssets(
		vaultAddress: string,
		shares: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		return vaultContract.deposit.populateTransaction(assets, receiver)
	}

	/**
	 * Encodes the deposit parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string} vaultAddress - The address of the vault where assets will be deposited.
	 * @param {Object} options - An object containing the parameters for the deposit operation.
	 * @param {BigNumberish} options.assets - The amount of assets to be deposited.
	 * @param {string} options.receiver - The address of the receiver whose assets will be deposited and shares will be received.
	 * @param {Provider} provider - The custom provider to use for this call.
	 *
	 * @returns {TransactionData} The encoded transaction data.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address.
	 */
	encodeDepositSync(
		vaultAddress: string,
		{
			assets,
			receiver,
		}: {
			assets: BigNumberish
			receiver: string
		},
		provider?: Provider
	): TransactionData {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		const data = vaultContract.interface.encodeFunctionData('deposit', [
			assets,
			receiver,
		])

		return {
			to: vaultAddress,
			data,
		}
	}

	/**
	 * Deposits specified assets into a vault from the receiver's address.
	 *
	 * @param {string} vaultAddress - The address of the vault into which the assets are to be deposited.
	 * @param {Object} options - An object containing deposit parameters.
	 * @param {BigNumberish} options.assets - The amount of assets to be deposited into the vault.
	 * @param {string} options.receiver - The address of the receiver whose assets will be deposited and shares will be received.
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress, provider),
			this.encodeDeposit(vaultAddress, options, provider),
			'encodeDeposit'
		)
	}

	/**
	 * Gets the maximum amount that can be withdrawn from a specified vault by a particular owner.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the maximum amount that can be withdrawn by the owner from the vault.
	 */
	async maxWithdraw(
		vaultAddress: string,
		owner: string,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		return vaultContract.maxWithdraw(owner)
	}

	/**
	 * Previews the amount of shares that would be withdrawn for a given amount of assets from a specific vault.
	 *
	 * @method previewWithdraw
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} assets - The amount of assets for which to preview the withdrawal.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the amount of shares that would be withdrawn for the given assets amount.
	 */
	async previewWithdraw(
		vaultAddress: string,
		assets: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		return vaultContract.withdraw.populateTransaction(assets, receiver, owner)
	}

	/**
	 * Encodes the withdrawal parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string} vaultAddress - The address of the vault from which assets will be withdrawn.
	 * @param {Object} options - An object containing the parameters for the withdrawal operation.
	 * @param {BigNumberish} options.assets - The amount of assets to be withdrawn.
	 * @param {string} options.receiver - The address of the receiver who will get the withdrawn assets.
	 * @param {string} options.owner - The address of the current owner of the assets.
	 * @param {Provider} provider - The custom provider to use for this call.
	 *
	 * @returns {TransactionData} The encoded transaction data.
	 *
	 * @throws Will throw an error if the ERC4626 contract is not found for the provided vault address.
	 */
	encodeWithdrawSync(
		vaultAddress: string,
		{
			assets,
			receiver,
			owner,
		}: {
			assets: BigNumberish
			receiver: string
			owner: string
		},
		provider?: Provider
	): TransactionData {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		const data = vaultContract.interface.encodeFunctionData('withdraw', [
			assets,
			receiver,
			owner,
		])

		return {
			to: vaultAddress,
			data,
		}
	}

	/**
	 * Withdraws specified assets from a vault and sends them to a receiver's address.
	 *
	 * @param {string} vaultAddress - The address of the vault from which the assets are to be withdrawn.
	 * @param {Object} options - An object containing withdrawal parameters.
	 * @param {BigNumberish} options.assets - The amount of assets to be withdrawn from the vault.
	 * @param {string} options.receiver - The address of the receiver to which the withdrawn assets will be sent.
	 * @param {string} options.owner - The address of the owner initiating the withdrawal. This should be the signer of the transaction.
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress, provider),
			this.encodeWithdraw(vaultAddress, options, provider),
			'encodeWithdraw'
		)
	}

	/**
	 * Gets the maximum amount of shares that can be redeemed by a particular owner from a specified vault.
	 *
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {string} owner - The address of the owner.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the maximum amount of shares that can be redeemed by the owner from the vault.
	 */
	async maxRedeem(
		vaultAddress: string,
		owner: string,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
		)
		return vaultContract.maxRedeem(owner)
	}

	/**
	 * Previews the amount of assets that would be received for a given amount of shares from a specific vault.
	 *
	 * @method previewRedeem
	 * @param {string} vaultAddress - The address of the vault.
	 * @param {BigNumberish} shares - The amount of shares for which to preview the redemption.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a bigint representing the amount of assets that would be received for the given shares amount.
	 */
	async previewRedeem(
		vaultAddress: string,
		shares: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		return vaultContract.redeem.populateTransaction(shares, receiver, owner)
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
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeRedeemSync(
		vaultAddress: string,
		{
			shares,
			receiver,
			owner,
		}: {
			shares: BigNumberish
			receiver: string
			owner: string
		},
		provider?: Provider
	): TransactionData {
		const vaultContract = this.premia.contracts.getERC4626Contract(
			vaultAddress,
			provider
		)
		const data = vaultContract.interface.encodeFunctionData('redeem', [
			shares,
			receiver,
			owner,
		])

		return {
			to: vaultAddress,
			data,
		}
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
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a ContractTransactionResponse which contains information about the transaction that redeemed the shares.
	 */
	async redeem(
		vaultAddress: string,
		options: {
			shares: BigNumberish
			receiver: string
			owner: string
		},
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getERC4626Contract(vaultAddress, provider),
			this.encodeRedeem(vaultAddress, options, provider),
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		taker: string,
		provider?: Provider
	): Promise<bigint> {
		const vaultContract = await this.premia.contracts.getVaultContract(
			vaultAddress,
			provider ?? this.premia.multicallProvider
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultContract = this.premia.contracts.getVaultContract(
			vaultAddress,
			provider
		)
		return vaultContract.trade.populateTransaction(
			poolKey,
			size,
			isBuy,
			premiumLimit,
			this.premia.pools.toReferrer(referrer)
		)
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
	 * @param {Provider} provider - The custom provider to use for this call.
	 *
	 * @returns {TransactionData} The encoded transaction data.
	 *
	 * @throws Will throw an error if the vault contract is not found for the provided vault address.
	 */
	encodeTradeSync(
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
		},
		provider?: Provider
	): TransactionData {
		const vaultContract = this.premia.contracts.getVaultContract(
			vaultAddress,
			provider
		)
		const data = vaultContract.interface.encodeFunctionData('trade', [
			poolKey,
			size,
			isBuy,
			premiumLimit,
			this.premia.pools.toReferrer(referrer),
		])

		return {
			to: vaultAddress,
			data,
		}
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
	 * @param {Provider} provider - The custom provider to use for this call.
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
		},
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVaultContract(vaultAddress, provider),
			this.encodeTrade(vaultAddress, options, provider),
			'encodeTrade'
		)
	}
}

export default VaultAPI
