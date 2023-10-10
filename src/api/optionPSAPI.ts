import { ContractTransaction } from 'ethers'
import { BaseAPI } from './baseAPI'

/**
 * Represents a class for handling pool operations related to the subgraph and the pool contracts.
 *
 * @class OptionPSAPI
 * @extends {BaseAPI}
 */
export class OptionPSAPI extends BaseAPI {
	/**
	 * get the amount of exerciseToken to pay to exercise the given amount of contracts
	 *
	 * @param {string} optionAddress - The address of the option.
	 * @param {bigint} strike - The address of the option.
	 * @param {bigint} contractSize - The address of the option.
	 * @returns {Promise<[bigint, bigint] & { totalExerciseCost: bigint; fee: bigint }>} The amount of exerciseToken to pay to exercise the given amount of contracts
	 */
	async getExerciseCost(
		optionAddress: string,
		strike: bigint,
		contractSize: bigint
	): Promise<[bigint, bigint] & { totalExerciseCost: bigint; fee: bigint }> {
		const contract = this.premia.contracts.getOptionPSContract(optionAddress)

		const exerciseCost = await contract.getExerciseCost(strike, contractSize)
		return exerciseCost
	}

	/**
	 * Returns a promise containing a populated transaction to exercise an option. Allows the user to use the SDK without providing a signer.
	 * @param optionPSAddress {string} Contract address of the option.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @param contractSize {bigint} size of the option to exercise.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeExercise(
		optionPSAddress: string,
		strike: bigint,
		maturity: bigint,
		contractSize: bigint
	): Promise<ContractTransaction> {
		const optionPSContract =
			this.premia.contracts.getOptionPSContract(optionPSAddress)

		return optionPSContract.exercise.populateTransaction(
			strike,
			maturity,
			contractSize
		)
	}

	/**
	 * Returns a promise containing a populated transaction to cancel option exercise before maturity. Allows the user to use the SDK without providing a signer.
	 * @param optionPSAddress {string} Contract address of the option.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @param contractSize {bigint} size of the option to exercise.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeCancelExercise(
		optionPSAddress: string,
		strike: bigint,
		maturity: bigint,
		contractSize: bigint
	): Promise<ContractTransaction> {
		const optionPSContract =
			this.premia.contracts.getOptionPSContract(optionPSAddress)

		return optionPSContract.cancelExercise.populateTransaction(
			strike,
			maturity,
			contractSize
		)
	}

	/**
	 * Returns a promise containing a populated transaction to settle the exercised long options held by the caller. Allows the user to use the SDK without providing a signer.
	 * @param optionPSAddress {string} Contract address of the option.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @param contractSize {bigint} size of the option to settle.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettleLong(
		optionPSAddress: string,
		strike: bigint,
		maturity: bigint,
		contractSize: bigint
	): Promise<ContractTransaction> {
		const optionPSContract =
			this.premia.contracts.getOptionPSContract(optionPSAddress)

		return optionPSContract.settleLong.populateTransaction(
			strike,
			maturity,
			contractSize
		)
	}

	/**
	 * Returns a promise containing a populated transaction to settle the short options held by the caller. Allows the user to use the SDK without providing a signer.
	 * @param optionPSAddress {string} Contract address of the option.
	 * @param strike {bigint} strike price of the option.
	 * @param maturity {bigint} maturity of the option
	 * @param contractSize {bigint} size of the option to settle.
	 * @returns {Promise<ContractTransaction>} Promise containing the contract transaction.
	 */
	async encodeSettleShort(
		optionPSAddress: string,
		strike: bigint,
		maturity: bigint,
		contractSize: bigint
	): Promise<ContractTransaction> {
		const optionPSContract =
			this.premia.contracts.getOptionPSContract(optionPSAddress)

		return optionPSContract.settleShort.populateTransaction(
			strike,
			maturity,
			contractSize
		)
	}
}
