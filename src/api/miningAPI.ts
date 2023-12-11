import { BigNumberish, ContractTransaction } from 'ethers'
import { BaseAPI } from './baseAPI'
import { IVaultMining } from '@premia/v3-abi/typechain'

/**
 * Represents a class for handling operations related to making liquidity mining.
 *
 * @class MiningAPI
 * @extends {BaseAPI}
 */
export class MiningAPI extends BaseAPI {
	/**
	 * Returns a promise containing vote multipler for a vault.
	 * @param vault {string} The address of the vault.
	 * @returns {Promise<bigint>} Promise vote multiplier for a vault.
	 */
	async getVoteMultiplier({ vault }: { vault: string }): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getVoteMultiplier(vault)
	}

	/**
	 * Returns a promise containing the amount of pending user rewards for a vault.
	 * @param user {string} The address of the user.
	 * @param vault {string} The addres of individual vault.
	 * @returns {Promise<bigint>} Promise the amount of pending user rewards for a vault.
	 */
	async getPendingUserRewardsFromVault({
		user,
		vault,
	}: {
		user: string
		vault: string
	}): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getPendingUserRewardsFromVault(user, vault)
	}

	/**
	 * Returns a promise containing total amount of pending user rewards.
	 * @param user {string} The address of the user.
	 * @returns {Promise<bigint>} Promise total amount of pending user rewards.
	 */
	async getTotalUserRewards({ user }: { user: string }): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getTotalUserRewards(user)
	}

	/**
	 * Returns a promise containing amount of user rewards.
	 * @param user {string} The address of the user.
	 * @returns {Promise<bigint>} Promise amount of user rewards.
	 */
	async getUserRewards({ user }: { user: string }): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getUserRewards(user)
	}

	/**
	 * Returns a promise containing amount of user rewards.
	 * @param vault {string} The address of vault.
	 * @param user {string} The address of the user.
	 * @returns {Promise<bigint>} Promise amount of pending dual mining rewards.
	 */
	async getDualMiningRewards({
		vault,
		user,
	}: {
		vault: string
		user: string
	}): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		const miningPools = await vaultMiningContract.getDualMiningPools(vault)
		let miningRewards = 0n
		for (const miningPool of miningPools) {
			const dualMiningContract =
				this.premia.contracts.getDualMiningContract(miningPool)
			const pendingRewards = await dualMiningContract.getPendingUserRewards(
				user
			)
			miningRewards += pendingRewards
		}
		return miningRewards
	}

	/**
	 * Returns strike and maturity before claiming premia option rewards.
	 * @returns {Promise<[bigint, bigint] & {strike: bigint, maturity: bigint}>} A promise that resolves to the strike and maturity for premia option rewards.
	 */
	async previewOptionParams(): Promise<
		[bigint, bigint] & {
			strike: bigint
			maturity: bigint
		}
	> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.previewOptionParams()
	}

	/**
	 * Returns the total number of votes across all targets (vaults).
	 * @returns {Promise<bigint>} A promise that resolves to the total number of votes across all targets (vaults).
	 */
	async getTotalVotes(): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getTotalVotes()
	}

	/**
	 * Returns the VaultInfo including the number of votes for the specified vault.
	 * @param vaultAddress {string} The address of the vault.
	 * @returns {Promise<IVaultMining.VaultInfoStructOutput>} A promise that resolves to the VaultInfo including the number of votes for the specified vault.
	 */
	async getVaultInfo(
		vaultAddress: string
	): Promise<IVaultMining.VaultInfoStructOutput> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getVaultInfo(vaultAddress)
	}

	/**
	 * Returns the UserInfo including the votes of the specified user in the vault.
	 * @param user {string} The address of the user.
	 * @param vaultAddress {string} The address of the vault.
	 * @returns {Promise<IVaultMining.UserInfoStructOutput>} A promise that resolves to the UserInfo including the votes of the specified user in the vault.
	 */
	async getUserInfo(
		user: string,
		vaultAddress: string
	): Promise<IVaultMining.UserInfoStructOutput> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getUserInfo(user, vaultAddress)
	}

	/**
	 * Returns the total number of rewards across all targets for the next year.
	 * @returns {Promise<bigint>} A promise that resolves to the total number of rewards across all targets for the next year.
	 */
	async getRewardsPerYear(): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getRewardsPerYear()
	}

	/**
	 * Encodes the claimAll parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim all rewards.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claimAll operation.
	 */
	async encodeClaimAll(vaults: string[]): Promise<ContractTransaction> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.claimAll.populateTransaction(vaults)
	}

	/**
	 * Encodes the claim parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} vaults - array of addresses of vaults to claim partial amount.
	 * @param {BigNumberish} amount - amount of rewards to claim.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claim operation.
	 */
	async encodeClaim(
		vaults: string[],
		amount: BigNumberish
	): Promise<ContractTransaction> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.claim.populateTransaction(vaults, amount)
	}
}
