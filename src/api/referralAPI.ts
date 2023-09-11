import { BaseAPI } from './baseAPI'
import { ContractTransaction } from 'ethers'

/**
 * Represents a class for handling operations related to making analytics queries from the subgraph.
 *
 * @class ReferralAPI
 * @extends {BaseAPI}
 */
export class ReferralAPI extends BaseAPI {
	/**
	 * Returns a promise containing the array of tokens and amounts for referral fees.
	 * @param referrer {string} The address of the referrer.
	 * @param vault {string} The addres of the vault addresses.
	 * @returns {Promise<[string[], bigint[]] & { tokens: string[]; rebates: bigint[] }>} Promise the array of tokens and amounts for referral fees.
	 */
	async getRebates(
		referrer: string
	): Promise<[string[], bigint[]] & { tokens: string[]; rebates: bigint[] }> {
		const referralContract = this.premia.contracts.getReferralContract()
		return referralContract.getRebates(referrer)
	}

	/**
	 * Encodes the claimRebate parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} tokens - array of addresses of tokens to claim.
	 *
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claimRebate operation.
	 */
	async encodeClaimRebate(tokens: string[]): Promise<ContractTransaction> {
		const referralContract = this.premia.contracts.getReferralContract()
		return referralContract.claimRebate.populateTransaction(tokens)
	}
}
