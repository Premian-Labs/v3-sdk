import { BigNumberish, ContractTransaction } from 'ethers'
import { BaseAPI } from './baseAPI'
import { IVaultMining } from '../typechain'

/**
 * Represents a class for handling operations related to making liquidity mining.
 *
 * @class MiningAPI
 * @extends {BaseAPI}
 */
export class MiningAPI extends BaseAPI {
	/**
	 * Returns a promise containing the amount of pending user rewards for a vault.
	 * @param user {string} The address of the user.
	 * @param vault {string[]} The addres of the vault addresses.
	 * @returns {Promise<bigint>} Promise the amount of pending user rewards for a vault.
	 */
	async getPendingUserRewards({
		user,
		vaults,
	}: {
		user: string
		vaults: string[]
	}): Promise<bigint> {
		const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
		return vaultMiningContract.getPendingUserRewards(user, vaults)
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
