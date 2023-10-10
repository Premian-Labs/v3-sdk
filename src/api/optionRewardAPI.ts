import { ContractTransaction } from 'ethers'
import { BaseAPI } from './baseAPI'

/**
 * Represents a class for handling pool operations related to the subgraph and the pool contracts.
 *
 * @class OptionRewardAPI
 * @extends {BaseAPI}
 */
export class OptionRewardAPI extends BaseAPI {
	/**
	 * Returns a promise containing a populated transaction to claim rewards from option. Allows the user to use the SDK without providing a signer.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeClaimRewards(
		strike: bigint,
		maturity: bigint
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getOptionRewardContract()

		return contract.claimRewards.populateTransaction(strike, maturity)
	}
}
