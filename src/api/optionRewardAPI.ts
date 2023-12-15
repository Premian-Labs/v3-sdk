import { ContractTransaction, Provider } from 'ethers'
import { BaseAPI } from './baseAPI'
import { TransactionData } from '../entities'

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
		maturity: bigint,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getOptionRewardContract(provider)
		return contract.claimRewards.populateTransaction(strike, maturity)
	}

	/**
	 * Returns a promise containing a populated transaction to claim rewards from option. Allows the user to use the SDK without providing a signer.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeClaimRewardsSync(
		strike: bigint,
		maturity: bigint,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getOptionRewardContract(provider)
		const data = contract.interface.encodeFunctionData('claimRewards', [
			strike,
			maturity,
		])

		return {
			to: this.premia.contracts.optionRewardAddress,
			data,
		}
	}
}
