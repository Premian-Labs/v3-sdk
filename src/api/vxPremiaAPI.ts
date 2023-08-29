import { withCache } from '../cache'
import { CacheTTL } from '../constants'
import { BaseAPI } from './baseAPI'
import {
	Signature,
	StakeHistory,
	UserStake,
	VaultVote,
	Vote,
	VoteHistory,
	VoteVersion,
} from '../entities'
import {
	AbiCoder,
	BigNumberish,
	BytesLike,
	ContractTransaction,
	ContractTransactionResponse,
} from 'ethers'
import {
	IPremiaStaking,
	PremiaStakingStorage,
	VxPremiaStorage,
} from '../typechain/IVxPremia'
import { sendTransaction } from '../utils'

/**
 * @class
 * This class provides additional functionalities specific to the Premia Protocol.
 * This class exposes methods to interact with the Premia Protocol's user-related functionalities such as vault votes,
 * user stakes, stake histories and voting histories.
 *
 * Note: Several methods in this class use a caching mechanism (`@withCache`) to store recent responses,
 * thereby reducing latency and load on subsequent requests for the same data.
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
	@withCache(CacheTTL.MINUTE)
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
	@withCache(CacheTTL.MINUTE)
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
	 * @returns {Promise<bigint>} - A promise that resolves to the total number of votes.
	 */
	async getVotesForVault(vaultAddress: string): Promise<bigint> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract()
		// @dev: 1 = VoteVersion.VaultV3
		return vxPremiaContract.getPoolVotes(
			VoteVersion.VaultV3,
			AbiCoder.defaultAbiCoder().encode(['address'], [vaultAddress])
		)
	}

	/**
	 * Retrieves all votes a particular user has cast.
	 *
	 * @param {string} user - The address of the user.
	 * @returns {Promise<VxPremiaStorage.VoteStructOutput[]>} - A promise that resolves to an array of VoteStructOutput instances representing each vote the user has cast.
	 */
	async getUserVotes(
		user: string
	): Promise<VxPremiaStorage.VoteStructOutput[]> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract()
		return vxPremiaContract.getUserVotes(user)
	}

	/**
	 * Retrieves the total amount of available rewards.
	 *
	 * @returns {Promise<{rewards: bigint, unstakeRewards: bigint}>} - A promise that resolves to the amount of
	 * available rewards and unstake rewards respectively.
	 */
	async getAvailableRewards(): Promise<{
		rewards: bigint
		unstakeRewards: bigint
	}> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getAvailableRewards()
	}

	/**
	 * Calculates the total amount of rewards that are pending distribution.
	 * @returns {Promise<bigint>} - A promise that resolves to a the total amount of pending rewards.
	 */
	async getPendingRewards(): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getPendingRewards()
	}

	/**
	 * Retrieves the amount of rewards that are pending for a specific user.
	 * @param {string} user - The address of the user.
	 * @returns {Promise<{reward: bigint, unstakeReward: bigint}>} - A promise that resolves to the amount of rewards
	 * and unstake rewards that are pending for the user respectively.
	 */
	async getPendingUserRewards(
		user: string
	): Promise<{ reward: bigint; unstakeReward: bigint }> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getPendingUserRewards(user)
	}

	/**
	 * Gets the fee a user would have to pay to unstake early.
	 * @param {string} user - The address of the user.
	 * @returns {Promise<bigint>} - A promise that resolves to fee for unstaking early.
	 */
	async getEarlyUnstakeFee(user: string): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getEarlyUnstakeFee(user)
	}

	/**
	 * Gets the total power across all users (applying the bonus from lockup period chosen)
	 *
	 * @returns {Promise<bigint>} - A promise that resolves to the total power across all users
	 */
	async getTotalPower(): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getTotalPower()
	}

	/**
	 * Gets the power associated with a specific user.
	 *
	 * @param {string} user - The address of the user.
	 * @returns {Promise<bigint>} - A promise that resolves to the user's power.
	 */
	async getUserPower(user: string): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getUserPower(user)
	}

	/**
	 * Gets the discount a user receives.
	 * @param {string} user - The address of the user.
	 * @returns {Promise<bigint>} - A promise that resolves to the user's discount.
	 */
	async getDiscount(user: string): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getDiscount(user)
	}

	/**
	 * Gets the information of a user.
	 *
	 * @param {string} user - The address of the user.
	 * @returns {Promise<PremiaStakingStorage.UserInfoStructOutput>} - A promise that resolves to a UserInfoStructOutput
	 * instance representing the user's information.
	 */
	async getUserInfo(
		user: string
	): Promise<PremiaStakingStorage.UserInfoStructOutput> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getUserInfo(user)
	}

	/**
	 * Gets the total amount of withdrawals.
	 *
	 * @returns {Promise<bigint>} - A promise that resolves to the total amount of pending withdrawals.
	 */
	async getPendingWithdrawals(): Promise<bigint> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getPendingWithdrawals()
	}

	/**
	 * Retrieves the information of a pending withdrawal of a user.
	 *
	 * @param {string} user - The address of the user.
	 * @returns {Promise<{amount: bigint, startDate: bigint, unlockDate: bigint}>} - A promise that resolves to the
	 * amount, start date, and unlock date of the user's pending withdrawal respectively.
	 */
	async getPendingWithdrawal(
		user: string
	): Promise<{ amount: bigint; startDate: bigint; unlockDate: bigint }> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.getPendingWithdrawal(user)
	}

	/**
	 * Gets the stake levels.
	 *
	 * @returns {Promise<ContractTransactionResponse>} - A Promise that resolves to a ContractTransactionResponse
	 * instance representing the stake levels.
	 */
	async getStakeLevels(): Promise<IPremiaStaking.StakeLevelStructOutput[]> {
		const contract = await this.premia.contracts.getVxPremiaContract()
		return contract.getStakeLevels()
	}

	/**
	 * Gets the stake period multiplier.
	 *
	 * @param {BigNumberish} period - The duration (in seconds) for which tokens are locked
	 * @returns {Promise<ContractTransactionResponse>} - Returns a Promise that resolves to the multiplier for this
	 * staking period
	 */
	async getStakePeriodMultiplier(period: BigNumberish): Promise<bigint> {
		const contract = await this.premia.contracts.getVxPremiaContract()
		return contract.getStakePeriodMultiplier(period)
	}

	/**
	 * Gets the available amount of Premia.
	 *
	 * @returns {Promise<bigint>} - A promise that resolves the available amount of Premia.
	 */
	async getAvailablePremiaAmount(): Promise<bigint> {
		const contract = await this.premia.contracts.getVxPremiaContract()
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
	 * @returns {Promise<[bigint, bigint] & { nativeFee: bigint; zroFee: bigint; }>} - A promise that resolves to the
	 * fee for bridging vxPREMIA to the destination chain.
	 */
	async estimateSendFee(
		destinationChainId: BigNumberish,
		toAddress: string,
		amount: BigNumberish,
		useZro: boolean,
		adapterParams: BytesLike
	): Promise<[bigint, bigint] & { nativeFee: bigint; zroFee: bigint }> {
		const contract = await this.premia.contracts.getVxPremiaContract()
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
		adapterParams: BytesLike
	): Promise<ContractTransaction> {
		const contract = await this.premia.contracts.getVxPremiaContract()
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
	 * Bridges vxPREMIA tokens to the destination chain.
	 * @param {string} from - The address from which the tokens will be sent.
	 * @param {BigNumberish} destinationChainId - The id of the destination chain.
	 * @param {string} toAddress - The address to which the tokens will be sent.
	 * @param {BigNumberish} amount - The amount of tokens to be sent.
	 * @param {string} refundAddress - The address to which the tokens will be refunded in case of failure.
	 * @param {string} zroPaymentAddress - The address to which the ZRO payment will be sent.
	 * @param {BytesLike} adapterParams - The adapter params.
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
		adapterParams: BytesLike
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeSendFrom(
				from,
				destinationChainId,
				toAddress,
				amount,
				refundAddress,
				zroPaymentAddress,
				adapterParams
			),
			'encodeSendFrom'
		)
	}

	/**
	 * Encodes a transaction to cast votes.
	 *
	 * @param {Vote[]} votes - An array of Vote instances representing the votes to be cast.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance
	 * representing the encoded transaction.
	 */
	async encodeCastVotes(votes: Vote[]): Promise<ContractTransaction> {
		const vxPremiaContract = this.premia.contracts.getVxPremiaContract()
		return vxPremiaContract.castVotes.populateTransaction(votes)
	}

	/**
	 * Casts votes.
	 *
	 * @param {Vote[]} votes - An array of Vote instances representing the votes to be cast.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async castVotes(votes: Vote[]): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeCastVotes(votes),
			'encodeCastVotes'
		)
	}

	/**
	 * Encodes a transaction to stake.
	 *
	 * @param {BigNumberish} amount - The amount to be staked.
	 * @param {BigNumberish} period - The staking period.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */

	async encodeStake(
		amount: BigNumberish,
		period: BigNumberish
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.stake.populateTransaction(amount, period)
	}

	/**
	 * Stakes an amount for a certain period.
	 *
	 * @param {BigNumberish} amount - The amount to be staked.
	 * @param {BigNumberish} period - The staking period.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async stake(
		amount: BigNumberish,
		period: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeStake(amount, period),
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
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeStakeWithPermit(
		amount: BigNumberish,
		period: BigNumberish,
		deadline: BigNumberish,
		signature: Signature
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
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
	 * Stake using IERC2612 permit.
	 *
	 * @param {BigNumberish} amount - The amount of xPremia to stake.
	 * @param {BigNumberish} period - The lockup period (in seconds).
	 * @param {BigNumberish} deadline - The deadline after which permit will fail.
	 * @param {Signature} signature - The signature for the transaction.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async stakeWithPermit(
		amount: BigNumberish,
		period: BigNumberish,
		deadline: BigNumberish,
		signature: Signature
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeStakeWithPermit(amount, period, deadline, signature),
			'encodeStakeWithPermit'
		)
	}

	/**
	 * Encodes a transaction to update the lock period.
	 *
	 * @param {BigNumberish} period - The lock period.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeUpdateLock(period: BigNumberish): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.updateLock.populateTransaction(period)
	}

	/**
	 * Updates the lock period.
	 *
	 * @param {BigNumberish} period - The lock period.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async updateLock(period: BigNumberish): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeUpdateLock(period),
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
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeHarvestAndStake(options: {
		amountOutMin: BigNumberish
		callee: string
		allowanceTarget: string
		data: string
		refundAddress: string
		stakePeriod: BigNumberish
	}): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
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
	 * Harvests and stakes.
	 *
	 * @param {Object} options - The options for the operation.
	 * @param {BigNumberish} options.amountOutMin - The minimum amount out.
	 * @param {string} options.callee - The callee address.
	 * @param {string} options.allowanceTarget - The allowance target address.
	 * @param {string} options.data - The data for the operation.
	 * @param {string} options.refundAddress - The refund address.
	 * @param {BigNumberish} options.stakePeriod - The stake period.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async harvestAndStake(options: {
		amountOutMin: BigNumberish
		callee: string
		allowanceTarget: string
		data: string
		refundAddress: string
		stakePeriod: BigNumberish
	}): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeHarvestAndStake(options),
			'encodeHarvestAndStake'
		)
	}

	/**
	 * Encodes a transaction to harvest.
	 *
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeHarvest(): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.harvest.populateTransaction()
	}

	/**
	 * Harvests.
	 *
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async harvest(): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeHarvest(),
			'encodeHarvest'
		)
	}

	/**
	 * Encodes a transaction to unstake early.
	 *
	 * @param {BigNumberish} amount - The amount to be unstaked.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeEarlyUnstake(amount: BigNumberish): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.earlyUnstake.populateTransaction(amount)
	}

	/**
	 * Unstakes early.
	 *
	 * @param {BigNumberish} amount - The amount to be unstaked.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async earlyUnstake(
		amount: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeEarlyUnstake(amount),
			'encodeEarlyUnstake'
		)
	}

	/**
	 * Encodes a transaction to start a withdrawal.
	 *
	 * @param {BigNumberish} amount - The amount to be withdrawn.
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeStartWithdraw(
		amount: BigNumberish
	): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.startWithdraw.populateTransaction(amount)
	}

	/**
	 * Starts a withdrawal.
	 *
	 * @param {BigNumberish} amount - The amount to be withdrawn.
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async startWithdraw(
		amount: BigNumberish
	): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeStartWithdraw(amount),
			'encodeStartWithdraw'
		)
	}

	/**
	 * Encodes a transaction to withdraw.
	 *
	 * @returns {Promise<ContractTransaction>} - A promise that resolves to a ContractTransaction instance representing
	 * the encoded transaction.
	 */
	async encodeWithdraw(): Promise<ContractTransaction> {
		const contract = this.premia.contracts.getVxPremiaContract()
		return contract.withdraw.populateTransaction()
	}

	/**
	 * Withdraws.
	 *
	 * @returns {Promise<ContractTransactionResponse>} - A promise that resolves to a ContractTransactionResponse
	 * instance representing the result of the transaction.
	 */
	async withdraw(): Promise<ContractTransactionResponse> {
		return sendTransaction(
			this.premia.contracts.getVxPremiaContract(),
			this.encodeWithdraw(),
			'encodeWithdraw'
		)
	}
}
