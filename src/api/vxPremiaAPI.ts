import {
	BigNumberish,
	BytesLike,
	ContractTransaction,
	ContractTransactionResponse,
	Provider,
} from 'ethers'
import {
	IPremiaStaking,
	PremiaStakingStorage,
	VxPremiaStorage,
} from '@premia/v3-abi/typechain/IVxPremia'

import { BaseAPI } from './baseAPI'
import {
	Signature,
	StakeHistory,
	TransactionData,
	UserStake,
	VaultVote,
	Vote,
	VoteHistory,
	VoteVersion,
} from '../entities'
import { sendTransaction } from '../utils'

/**
 * @class
 * This class provides additional functionalities specific to the Premia Protocol.
 * This class exposes methods to interact with the Premia Protocol's user-related functionalities such as vault votes,
 * user stakes, stake histories and voting histories.
 *
 * @extends BaseAPI
 */
export class VxPremiaAPI extends BaseAPI {
	/**
	 * Retrieves vault votes for a given user.
	 *
	 * @param {string} user - The user's address.
	 * @param {number} [first=100] - The maximum number of records to retrieve.
	 * @param {number} [skip=0] - The number of records to skip.
	 * @returns {Promise<VaultVote[]>} A promise that resolves to an array of vault votes.
	 */
	async getVaultVotes(
		user: string,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		return this.premia.subgraph.getVaultVotes(user, first, skip)
	}

	/**
	 * Retrieves vault votes for a given user and timestamp range.
	 *
	 * @param {string} user - The user's address.
	 * @param {number} timestampFrom - The start timestamp for the range.
	 * @param {number} timestampTo - The end timestamp for the range.
	 * @param {number} [first=100] - The maximum number of records to retrieve.
	 * @param {number} [skip=0] - The number of records to skip.
	 * @returns {Promise<VaultVote[]>} A promise that resolves to an array of vault votes.
	 */
	async getUserVaultVotesFromTimestamp(
		user: string,
		timestampFrom: number,
		timestampTo: number,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		return this.premia.subgraph.getUserVaultVotesFromTimestamp(
			user,
			timestampFrom,
			timestampTo,
			first,
			skip
		)
	}

	/**
	 * Retrieves all the last vault votes.
	 *
	 * @param {string} orderBy - The field to order the results by.
	 * @param {string} order - The order direction ('asc' or 'desc').
	 * @param {number} [first=100] - The maximum number of records to retrieve.
	 * @param {number} [skip=0] - The number of records to skip.
	 * @returns {Promise<VaultVote[]>} A promise that resolves to an array of vault votes.
	 */
	async getAllLastVaultVotes(
		orderBy: string,
		order: string,
		first: number = 100,
		skip: number = 0
	): Promise<VaultVote[]> {
		return this.premia.subgraph.getAllLastVaultVotes(
			orderBy,
			order,
			first,
			skip
		)
	}

	/**
	 * Retrieves vote history for a given id.
	 *
	 * @param {string} id - The id of the vote.
	 * @returns {Promise<VoteHistory>} A promise that resolves to the vote history.
	 */
	async getVoteHistory(id: string): Promise<VoteHistory> {
		return this.premia.subgraph.getVoteHistory(id)
	}

	/**
	 * Retrieves the last user stakes.
	 *
	 * @returns {Promise<UserStake[]>} A promise that resolves to an array of user stakes.
	 */
	async getLastUserStakes(): Promise<UserStake[]> {
		return this.premia.subgraph.getLastUserStakes()
	}

	/**
	 * Retrieves user stakes for a given start time.
	 *
	 * @param {number} startTime - The start time for retrieving stakes.
	 * @param {string} user - The user's address.
	 * @param {number} [first=100] - The maximum number of records to retrieve.
	 * @param {number} [skip=0] - The number of records to skip.
	 * @returns {Promise<UserStake[]>} A promise that resolves to an array of user stakes.
	 */
	async getUserStakes(
		startTime: number,
		user: string,
		first: number = 100,
		skip: number = 0
	): Promise<UserStake[]> {
		return this.premia.subgraph.getUserStakes(startTime, user, first, skip)
	}

	/**
	 * Retrieves the last user stake from a given timestamp.
	 *
	 * @param {number} timestamp - The timestamp for retrieving the stake.
	 * @param {string} user - The user's address.
	 * @returns {Promise<UserStake[]>} A promise that resolves to an array of user stakes.
	 */
	async getLastUserStakeFromTimestamp(
		timestamp: number,
		user: string
	): Promise<UserStake[]> {
		return this.premia.subgraph.getLastUserStakeFromTimestamp(timestamp, user)
	}

	/**
	 * Retrieves stake history for a given id.
	 *
	 * @param {string} id - The id of the stake.
	 * @returns {Promise<StakeHistory>} A promise that resolves to the stake history.
	 */
	async getStakeHistory(id: string): Promise<StakeHistory> {
		return this.premia.subgraph.getStakeHistory(id)
	}

	/**
	 * Retrieves stake histories for a given start time.
	 *
	 * @param {number} startTime - The start time for retrieving stake histories.
	 * @param {number} [first=100] - The maximum number of records to retrieve.
	 * @param {number} [skip=0] - The number of records to skip.
	 * @returns {Promise<StakeHistory[]>} A promise that resolves to an array of stake histories.
	 */
	async getStakeHistories(
		startTime: number,
		first: number = 100,
		skip: number = 0
	): Promise<StakeHistory[]> {
		return this.premia.subgraph.getStakeHistories(startTime, first, skip)
	}

	/**
	 * Retrieves the total number of votes associated with a specific vault.
	 *
	 * @param {string} vaultAddress - The Ethereum address of the vault.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the total number of votes.
	 */
	async getVotesForVault(
		vaultAddress: string,
		provider?: Provider
	): Promise<bigint> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		// @dev: 1 = VoteVersion.VaultV3
		return vxPremiaContract.getPoolVotes(VoteVersion.VaultV3, vaultAddress)
	}

	/**
	 * Retrieves all votes a particular user has cast.
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<VxPremiaStorage.VoteStructOutput[]>} - A promise that resolves to an array of VoteStructOutput instances representing each vote the user has cast.
	 */
	async getUserVotes(
		user: string,
		provider?: Provider
	): Promise<VxPremiaStorage.VoteStructOutput[]> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return vxPremiaContract.getUserVotes(user)
	}

	/**
	 * Retrieves the total amount of available rewards.
	 *
	 * @params {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<[bigint, bigint] & {rewards: bigint, unstakeRewards: bigint}>} - A promise that resolves to the amount of
	 * available rewards and unstake rewards respectively.
	 */
	async getAvailableRewards(provider?: Provider): Promise<
		[bigint, bigint] & {
			rewards: bigint
			unstakeRewards: bigint
		}
	> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getAvailableRewards()
	}

	/**
	 * Calculates the total amount of rewards that are pending distribution.
	 *
	 * @params {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to a the total amount of pending rewards.
	 */
	async getPendingRewards(provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getPendingRewards()
	}

	/**
	 * Retrieves the amount of rewards that are pending for a specific user.
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<[bigint, bigint] & {reward: bigint, unstakeReward: bigint}>} - A promise that resolves to the amount of rewards
	 * and unstake rewards that are pending for the user respectively.
	 */
	async getPendingUserRewards(
		user: string,
		provider?: Provider
	): Promise<[bigint, bigint] & { reward: bigint; unstakeReward: bigint }> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getPendingUserRewards(user)
	}

	/**
	 * Gets the fee percentage a user would have to pay to unstake early.
	 * (fee percentage * lock amount = fee amount)
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to fee percentage for unstaking early.
	 */
	async getEarlyUnstakeFee(user: string, provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getEarlyUnstakeFee(user)
	}

	/**
	 * Gets the total power across all users (applying the bonus from lockup period chosen)
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the total power across all users
	 */
	async getTotalPower(provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getTotalPower()
	}

	/**
	 * Gets the power associated with a specific user.
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the user's power.
	 */
	async getUserPower(user: string, provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getUserPower(user)
	}

	/**
	 * Gets the discount a user receives.
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the user's discount.
	 */
	async getDiscount(user: string, provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getDiscount(user)
	}

	/**
	 * Gets the information of a user.
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<PremiaStakingStorage.UserInfoStructOutput>} - A promise that resolves to a UserInfoStructOutput
	 * instance representing the user's information.
	 */
	async getUserInfo(
		user: string,
		provider?: Provider
	): Promise<PremiaStakingStorage.UserInfoStructOutput> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getUserInfo(user)
	}

	/**
	 * Gets the total amount of withdrawals.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves to the total amount of pending withdrawals.
	 */
	async getPendingWithdrawals(provider?: Provider): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getPendingWithdrawals()
	}

	/**
	 * Retrieves the information of a pending withdrawal of a user.
	 *
	 * @param {string} user - The address of the user.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<[bigint, bigint, bigint] & {amount: bigint, startDate: bigint, unlockDate: bigint}>} - A promise that resolves to the
	 * amount, start date, and unlock date of the user's pending withdrawal respectively.
	 */
	async getPendingWithdrawal(
		user: string,
		provider?: Provider
	): Promise<
		[bigint, bigint, bigint] & {
			amount: bigint
			startDate: bigint
			unlockDate: bigint
		}
	> {
		const contract = this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getPendingWithdrawal(user)
	}

	/**
	 * Gets the stake levels.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A Promise that resolves to a ContractTransactionResponse
	 * instance representing the stake levels.
	 */
	async getStakeLevels(
		provider?: Provider
	): Promise<IPremiaStaking.StakeLevelStructOutput[]> {
		const contract = await this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getStakeLevels()
	}

	/**
	 * Gets the stake period multiplier.
	 *
	 * @param {BigNumberish} period - The duration (in seconds) for which tokens are locked
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - Returns a Promise that resolves to the multiplier for this
	 * staking period
	 */
	async getStakePeriodMultiplier(
		period: BigNumberish,
		provider?: Provider
	): Promise<bigint> {
		const contract = await this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getStakePeriodMultiplier(period)
	}

	/**
	 * Gets the available amount of Premia.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} - A promise that resolves the available amount of Premia.
	 */
	async getAvailablePremiaAmount(provider?: Provider): Promise<bigint> {
		const contract = await this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.getAvailablePremiaAmount()
	}

	/**
	 * Estimates the fee for bridging vxPREMIA to the destination chain.
	 *
	 * @param {BigNumberish} destinationChainId - The id of the destination chain.
	 * @param {string} toAddress - The address to which the tokens will be sent.
	 * @param {BigNumberish} amount - The amount of tokens to be sent.
	 * @param {boolean} useZro - Whether to use ZRO or not.
	 * @param {BytesLike} adapterParams - The adapter params.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<[bigint, bigint] & { nativeFee: bigint; zroFee: bigint; }>} - A promise that resolves to the
	 * fee for bridging vxPREMIA to the destination chain.
	 */
	async estimateSendFee(
		destinationChainId: BigNumberish,
		toAddress: string,
		amount: BigNumberish,
		useZro: boolean,
		adapterParams: BytesLike,
		provider?: Provider
	): Promise<[bigint, bigint] & { nativeFee: bigint; zroFee: bigint }> {
		const contract = await this.premia.contracts.getVxPremiaContract(
			provider ?? this.premia.multicallProvider
		)
		return contract.estimateSendFee(
			destinationChainId,
			toAddress,
			amount,
			useZro,
			adapterParams
		)
	}

	/**
	 * Encodes a transaction to bridge vxPREMIA tokens to the destination chain.
	 *
	 * @param {string} from - The address from which the tokens will be sent.
	 * @param {BigNumberish} destinationChainId - The id of the destination chain.
	 * @param {string} toAddress - The address to which the tokens will be sent.
	 * @param {BigNumberish} amount - The amount of tokens to be sent.
	 * @param {string} refundAddress - The address to which the tokens will be refunded in case of failure.
	 * @param {string} zroPaymentAddress - The address to which the ZRO payment will be sent.
	 * @param {BytesLike} adapterParams - The adapter params.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeSendFrom(
		from: string,
		destinationChainId: BigNumberish,
		toAddress: string,
		amount: BigNumberish,
		refundAddress: string,
		zroPaymentAddress: string,
		adapterParams: BytesLike,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = await this.premia.contracts.getVxPremiaContract(provider)
		return contract.sendFrom.populateTransaction(
			from,
			destinationChainId,
			toAddress,
			amount,
			refundAddress,
			zroPaymentAddress,
			adapterParams
		)
	}

	/**
	 * Encodes a transaction to bridge vxPREMIA tokens to the destination chain.
	 *
	 * @param {string} from - The address from which the tokens will be sent.
	 * @param {BigNumberish} destinationChainId - The id of the destination chain.
	 * @param {string} toAddress - The address to which the tokens will be sent.
	 * @param {BigNumberish} amount - The amount of tokens to be sent.
	 * @param {string} refundAddress - The address to which the tokens will be refunded in case of failure.
	 * @param {string} zroPaymentAddress - The address to which the ZRO payment will be sent.
	 * @param {BytesLike} adapterParams - The adapter params.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeSendFromSync(
		from: string,
		destinationChainId: BigNumberish,
		toAddress: string,
		amount: BigNumberish,
		refundAddress: string,
		zroPaymentAddress: string,
		adapterParams: BytesLike,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('sendFrom', [
			from,
			destinationChainId,
			toAddress,
			amount,
			refundAddress,
			zroPaymentAddress,
			adapterParams,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Bridges vxPREMIA tokens to the destination chain.
	 * @param {string} from - The address from which the tokens will be sent.
	 * @param {BigNumberish} destinationChainId - The id of the destination chain.
	 * @param {string} toAddress - The address to which the tokens will be sent.
	 * @param {BigNumberish} amount - The amount of tokens to be sent.
	 * @param {string} refundAddress - The address to which the tokens will be refunded in case of failure.
	 * @param {string} zroPaymentAddress - The address to which the ZRO payment will be sent.
	 * @param {BytesLike} adapterParams - The adapter params.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the transaction.
	 */
	async sendFrom(
		from: string,
		destinationChainId: BigNumberish,
		toAddress: string,
		amount: BigNumberish,
		refundAddress: string,
		zroPaymentAddress: string,
		adapterParams: BytesLike,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeSendFrom(
				from,
				destinationChainId,
				toAddress,
				amount,
				refundAddress,
				zroPaymentAddress,
				adapterParams,
				provider
			),
			'encodeSendFrom'
		)
	}

	/**
	 * Encodes a transaction to cast votes.
	 *
	 * @param {Vote[]} votes - An array of Vote instances representing the votes to be cast.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance
	 * representing the encoded transaction.
	 */
	async encodeCastVotes(
		votes: Vote[],
		provider?: Provider
	): Promise<ContractTransaction> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract(provider)
		return vxPremiaContract.castVotes.populateTransaction(votes)
	}

	/**
	 * Encodes a transaction to cast votes.
	 *
	 * @param {Vote[]} votes - An array of Vote instances representing the votes to be cast.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeCastVotesSync(votes: Vote[], provider?: Provider): TransactionData {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract(provider)
		const data = vxPremiaContract.interface.encodeFunctionData('castVotes', [
			votes,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Casts votes.
	 *
	 * @param {Vote[]} votes - An array of Vote instances representing the votes to be cast.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async castVotes(
		votes: Vote[],
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeCastVotes(votes, provider),
			'encodeCastVotes'
		)
	}

	/**
	 * Encodes a transaction to stake.
	 *
	 * @param {BigNumberish} amount - The amount to be staked.
	 * @param {BigNumberish} period - The staking period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */

	async encodeStake(
		amount: BigNumberish,
		period: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.stake.populateTransaction(amount, period)
	}

	/**
	 * Encodes a transaction to stake.
	 *
	 * @param {BigNumberish} amount - The amount to be staked.
	 * @param {BigNumberish} period - The staking period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */

	encodeStakeSync(
		amount: BigNumberish,
		period: BigNumberish,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('stake', [
			amount,
			period,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Stakes an amount for a certain period.
	 *
	 * @param {BigNumberish} amount - The amount to be staked.
	 * @param {BigNumberish} period - The staking period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async stake(
		amount: BigNumberish,
		period: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeStake(amount, period, provider),
			'encodeStake'
		)
	}

	/**
	 * Encodes a transaction to stake using IERC2612 permit.
	 *
	 * @param {BigNumberish} amount - The amount of xPremia to stake.
	 * @param {BigNumberish} period - The lockup period (in seconds).
	 * @param {BigNumberish} deadline - The deadline after which permit will fail.
	 * @param {Signature} signature - The signature for the transaction.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeStakeWithPermit(
		amount: BigNumberish,
		period: BigNumberish,
		deadline: BigNumberish,
		signature: Signature,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.stakeWithPermit.populateTransaction(
			amount,
			period,
			deadline,
			signature.v,
			signature.r,
			signature.s
		)
	}

	/**
	 * Encodes a transaction to stake using IERC2612 permit.
	 *
	 * @param {BigNumberish} amount - The amount of xPremia to stake.
	 * @param {BigNumberish} period - The lockup period (in seconds).
	 * @param {BigNumberish} deadline - The deadline after which permit will fail.
	 * @param {Signature} signature - The signature for the transaction.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeStakeWithPermitSync(
		amount: BigNumberish,
		period: BigNumberish,
		deadline: BigNumberish,
		signature: Signature,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('stakeWithPermit', [
			amount,
			period,
			deadline,
			signature.v,
			signature.r,
			signature.s,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Stake using IERC2612 permit.
	 *
	 * @param {BigNumberish} amount - The amount of xPremia to stake.
	 * @param {BigNumberish} period - The lockup period (in seconds).
	 * @param {BigNumberish} deadline - The deadline after which permit will fail.
	 * @param {Signature} signature - The signature for the transaction.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async stakeWithPermit(
		amount: BigNumberish,
		period: BigNumberish,
		deadline: BigNumberish,
		signature: Signature,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeStakeWithPermit(amount, period, deadline, signature, provider),
			'encodeStakeWithPermit'
		)
	}

	/**
	 * Encodes a transaction to update the lock period.
	 *
	 * @param {BigNumberish} period - The lock period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeUpdateLock(
		period: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.updateLock.populateTransaction(period)
	}

	/**
	 * Encodes a transaction to update the lock period.
	 *
	 * @param {BigNumberish} period - The lock period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeUpdateLockSync(
		period: BigNumberish,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('updateLock', [period])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Updates the lock period.
	 *
	 * @param {BigNumberish} period - The lock period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async updateLock(
		period: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeUpdateLock(period, provider),
			'encodeUpdateLock'
		)
	}

	/**
	 * Encodes a transaction to harvest and stake.
	 *
	 * @param {Object} options - The options for the operation.
	 * @param {BigNumberish} options.amountOutMin - The minimum amount out.
	 * @param {string} options.callee - The callee address.
	 * @param {string} options.allowanceTarget - The allowance target address.
	 * @param {string} options.data - The data for the operation.
	 * @param {string} options.refundAddress - The refund address.
	 * @param {BigNumberish} options.stakePeriod - The stake period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeHarvestAndStake(
		options: {
			amountOutMin: BigNumberish
			callee: string
			allowanceTarget: string
			data: string
			refundAddress: string
			stakePeriod: BigNumberish
		},
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const swapArgs = {
			amountOutMin: options.amountOutMin,
			callee: options.callee,
			allowanceTarget: options.allowanceTarget,
			data: options.data,
			refundAddress: options.refundAddress,
		}
		return contract.harvestAndStake.populateTransaction(
			swapArgs,
			options.stakePeriod
		)
	}

	/**
	 * Encodes a transaction to harvest and stake.
	 *
	 * @param {Object} options - The options for the operation.
	 * @param {BigNumberish} options.amountOutMin - The minimum amount out.
	 * @param {string} options.callee - The callee address.
	 * @param {string} options.allowanceTarget - The allowance target address.
	 * @param {string} options.data - The data for the operation.
	 * @param {string} options.refundAddress - The refund address.
	 * @param {BigNumberish} options.stakePeriod - The stake period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeHarvestAndStakeSync(
		options: {
			amountOutMin: BigNumberish
			callee: string
			allowanceTarget: string
			data: string
			refundAddress: string
			stakePeriod: BigNumberish
		},
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const swapArgs = {
			amountOutMin: options.amountOutMin,
			callee: options.callee,
			allowanceTarget: options.allowanceTarget,
			data: options.data,
			refundAddress: options.refundAddress,
		}
		const data = contract.interface.encodeFunctionData('harvestAndStake', [
			swapArgs,
			options.stakePeriod,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Harvests and stakes.
	 *
	 * @param {Object} options - The options for the operation.
	 * @param {BigNumberish} options.amountOutMin - The minimum amount out.
	 * @param {string} options.callee - The callee address.
	 * @param {string} options.allowanceTarget - The allowance target address.
	 * @param {string} options.data - The data for the operation.
	 * @param {string} options.refundAddress - The refund address.
	 * @param {BigNumberish} options.stakePeriod - The stake period.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async harvestAndStake(
		options: {
			amountOutMin: BigNumberish
			callee: string
			allowanceTarget: string
			data: string
			refundAddress: string
			stakePeriod: BigNumberish
		},
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeHarvestAndStake(options, provider),
			'encodeHarvestAndStake'
		)
	}

	/**
	 * Encodes a transaction to harvest.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeHarvest(provider?: Provider): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.harvest.populateTransaction()
	}

	/**
	 * Encodes a transaction to harvest.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeHarvestSync(provider?: Provider): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('harvest')

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Harvests.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async harvest(provider?: Provider): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeHarvest(provider),
			'encodeHarvest'
		)
	}

	/**
	 * Encodes a transaction to unstake early.
	 *
	 * @param {BigNumberish} amount - The amount to be unstaked.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeEarlyUnstake(
		amount: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.earlyUnstake.populateTransaction(amount)
	}

	/**
	 * Encodes a transaction to unstake early.
	 *
	 * @param {BigNumberish} amount - The amount to be unstaked.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeEarlyUnstakeSync(
		amount: BigNumberish,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('earlyUnstake', [amount])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Unstakes early.
	 *
	 * @param {BigNumberish} amount - The amount to be unstaked.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async earlyUnstake(
		amount: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeEarlyUnstake(amount, provider),
			'encodeEarlyUnstake'
		)
	}

	/**
	 * Encodes a transaction to start a withdrawal.
	 *
	 * @param {BigNumberish} amount - The amount to be withdrawn.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeStartWithdraw(
		amount: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.startWithdraw.populateTransaction(amount)
	}

	/**
	 * Encodes a transaction to start a withdrawal.
	 *
	 * @param {BigNumberish} amount - The amount to be withdrawn.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeStartWithdrawSync(
		amount: BigNumberish,
		provider?: Provider
	): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('startWithdraw', [
			amount,
		])

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Starts a withdrawal.
	 *
	 * @param {BigNumberish} amount - The amount to be withdrawn.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async startWithdraw(
		amount: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeStartWithdraw(amount, provider),
			'encodeStartWithdraw'
		)
	}

	/**
	 * Encodes a transaction to withdraw.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeWithdraw(provider?: Provider): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		return contract.withdraw.populateTransaction()
	}

	/**
	 * Encodes a transaction to withdraw.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} - The encoded transaction data.
	 */
	encodeWithdrawSync(provider?: Provider): TransactionData {
		const contract = this.premia.contracts.getVxPremiaContract(provider)
		const data = contract.interface.encodeFunctionData('withdraw')

		return {
			to: this.premia.contracts.vxPremiaAddress,
			data,
		}
	}

	/**
	 * Withdraws.
	 *
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async withdraw(provider?: Provider): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(provider),
			this.encodeWithdraw(provider),
			'encodeWithdraw'
		)
	}
}
