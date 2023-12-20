import { TransactionData } from '../entities'
import { BaseAPI } from './baseAPI'
import { ContractTransaction, Provider } from 'ethers'

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
	 * @param {Provider} provider The custom provider to use for this call.
	 * @returns {Promise<[string[], bigint[]] & { tokens: string[]; rebates: bigint[] }>} Promise the array of tokens and amounts for referral fees.
	 */
	async getRebates(
		referrer: string,
		provider?: Provider
	): Promise<[string[], bigint[]] & { tokens: string[]; rebates: bigint[] }> {
		const referralContract = this.premia.contracts.getReferralContract(
			provider ?? this.premia.multicallProvider
		)
		return referralContract.getRebates(referrer)
	}

	/**
	 * Encodes the claimRebate parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} tokens - array of addresses of tokens to claim.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to a contract transaction for the claimRebate operation.
	 */
	async encodeClaimRebate(
		tokens: string[],
		provider?: Provider
	): Promise<ContractTransaction> {
		const referralContract = this.premia.contracts.getReferralContract(provider)
		return referralContract.claimRebate.populateTransaction(tokens)
	}

	/**
	 * Encodes the claimRebate parameters into a transaction that can be broadcasted to the provider network.
	 *
	 * @param {string[]} tokens - array of addresses of tokens to claim.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeClaimRebateSync(
		tokens: string[],
		provider?: Provider
	): TransactionData {
		const referralContract = this.premia.contracts.getReferralContract(provider)
		const data = referralContract.interface.encodeFunctionData('claimRebate', [
			tokens,
		])

		return {
			to: this.premia.contracts.referralAddress,
			data,
		}
	}
}
