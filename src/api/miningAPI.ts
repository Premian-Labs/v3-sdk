import { BigNumberish, ContractTransaction } from 'ethers'
import { BaseAPI } from './baseAPI'

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
	 * @returns {Promise<[bigint, bigint] & {strike: bigint, maturity: bigint}>} Promise strike and maturity for premia option rewards.
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
