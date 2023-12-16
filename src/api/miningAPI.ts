import { BigNumberish, ContractTransaction, Provider } from 'ethers'
import { BaseAPI } from './baseAPI'
import { IVaultMining } from '@premia/v3-abi/typechain'
import { TransactionData } from '../entities'

/**
 * Represents a class for handling operations related to making liquidity mining.
 *
 * @class MiningAPI
 * @extends {BaseAPI}
 */
export class MiningAPI extends BaseAPI {
	/**
	 * Returns a promise containing vote multipler for a vault.
	 * @param {string} vault The address of the vault.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise vote multiplier for a vault.
	 */
	async getVoteMultiplier(
		{ vault }: { vault: string },
		provider?: Provider
	): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getVoteMultiplier(vault)
	}

	/**
	 * Returns a promise containing the amount of pending user rewards for a vault.
	 * @param {string} user The address of the user.
	 * @param {string} vault The addres of individual vault.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise the amount of pending user rewards for a vault.
	 */
	async getPendingUserRewardsFromVault(
		{
			user,
			vault,
		}: {
			user: string
			vault: string
		},
		provider?: Provider
	): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getPendingUserRewardsFromVault(user, vault)
	}

	/**
	 * Returns a promise containing total amount of pending user rewards.
	 * @param {string} user The address of the user.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise total amount of pending user rewards.
	 */
	async getTotalUserRewards(
		{ user }: { user: string },
		provider?: Provider
	): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getTotalUserRewards(user)
	}

	/**
	 * Returns a promise containing amount of user rewards.
	 * @param {string} user The address of the user.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise amount of user rewards.
	 */
	async getUserRewards(
		{ user }: { user: string },
		provider?: Provider
	): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getUserRewards(user)
	}

	/**
	 * Returns a promise containing amount of user rewards.
	 * @param {string} vault The address of vault.
	 * @param {string} user The address of the user.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} Promise amount of pending dual mining rewards.
	 */
	async getDualMiningRewards(
		{
			vault,
			user,
		}: {
			vault: string
			user: string
		},
		provider?: Provider
	): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		const miningPools = await vaultMiningContract.getDualMiningPools(vault)
		let miningRewards = 0n
		for (const miningPool of miningPools) {
			const dualMiningContract = this.premia.contracts.getDualMiningContract(
				miningPool,
				provider ?? this.premia.multicallProvider
			)
			const pendingRewards = await dualMiningContract.getPendingUserRewards(
				user
			)
			miningRewards += pendingRewards
		}
		return miningRewards
	}

	/**
	 * Returns strike and maturity before claiming premia option rewards.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<[bigint, bigint] & {strike: bigint, maturity: bigint}>} A promise that resolves to the strike and maturity for premia option rewards.
	 */
	async previewOptionParams(provider?: Provider): Promise<
		[bigint, bigint] & {
			strike: bigint
			maturity: bigint
		}
	> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.previewOptionParams()
	}

	/**
	 * Returns the total number of votes across all targets (vaults).
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to the total number of votes across all targets (vaults).
	 */
	async getTotalVotes(provider?: Provider): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getTotalVotes()
	}

	/**
	 * Returns the VaultInfo including the number of votes for the specified vault.
	 * @param {string} vaultAddress The address of the vault.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<IVaultMining.VaultInfoStructOutput>} A promise that resolves to the VaultInfo including the number of votes for the specified vault.
	 */
	async getVaultInfo(
		vaultAddress: string,
		provider?: Provider
	): Promise<IVaultMining.VaultInfoStructOutput> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getVaultInfo(vaultAddress)
	}

	/**
	 * Returns the UserInfo including the votes of the specified user in the vault.
	 * @param {string} user The address of the user.
	 * @param {string} vaultAddress The address of the vault.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<IVaultMining.UserInfoStructOutput>} A promise that resolves to the UserInfo including the votes of the specified user in the vault.
	 */
	async getUserInfo(
		user: string,
		vaultAddress: string,
		provider?: Provider
	): Promise<IVaultMining.UserInfoStructOutput> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getUserInfo(user, vaultAddress)
	}

	/**
	 * Returns the total number of rewards across all targets for the next year.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to the total number of rewards across all targets for the next year.
	 */
	async getRewardsPerYear(provider?: Provider): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract(
			provider ?? this.premia.multicallProvider
		)
		return vaultMiningContract.getRewardsPerYear()
	}

	/**
	 * Encodes the claimAll parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim all rewards.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claimAll operation.
	 */
	async encodeClaimAll(
		vaults: string[],
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultMiningContract =
			this.premia.contracts.getVaultMiningContract(provider)
		return vaultMiningContract.claimAll.populateTransaction(vaults)
	}

	/**
	 * Encodes the claimAll parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim all rewards.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeClaimAllSync(vaults: string[], provider?: Provider): TransactionData {
		const vaultMiningContract =
			this.premia.contracts.getVaultMiningContract(provider)
		const data = vaultMiningContract.interface.encodeFunctionData('claimAll', [
			vaults,
		])

		return {
			to: this.premia.contracts.vaultMiningAddress,
			data,
		}
	}

	/**
	 * Encodes the claim parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim partial amount.
	 * @param {BigNumberish} amount - amount of rewards to claim.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claim operation.
	 */
	async encodeClaim(
		vaults: string[],
		amount: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const vaultMiningContract =
			this.premia.contracts.getVaultMiningContract(provider)
		return vaultMiningContract.claim.populateTransaction(vaults, amount)
	}

	/**
	 * Encodes the claim parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim partial amount.
	 * @param {BigNumberish} amount - amount of rewards to claim.
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeClaimSync(
		vaults: string[],
		amount: BigNumberish,
		provider?: Provider
	): TransactionData {
		const vaultMiningContract =
			this.premia.contracts.getVaultMiningContract(provider)
		const data = vaultMiningContract.interface.encodeFunctionData('claim', [
			vaults,
			amount,
		])

		return {
			to: this.premia.contracts.vaultMiningAddress,
			data,
		}
	}
}
