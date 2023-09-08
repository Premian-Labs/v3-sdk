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
