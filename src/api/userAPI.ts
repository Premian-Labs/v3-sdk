import {
	BigNumberish,
	ContractTransaction,
	ContractTransactionResponse,
	Provider,
	toBigInt,
} from 'ethers'

import {
	ActionAuthorization,
	LiquidityPositionExtended,
	OptionPositionExtended,
	OrderType,
	TransactionData,
	User,
	UserExtended,
	UserPortfolio,
	UserPortfolioExtended,
	UserSnapshot,
	UserSnapshotExtended,
} from '../entities'
import { BaseAPI } from './baseAPI'

/**
 * @class UserAPI
 *
 * The UserAPI class extends the BaseAPI and provides methods to interact with the user data.
 * It implements caching mechanisms to optimize the repeated fetching of data.
 *
 * @extends {BaseAPI}
 */
export class UserAPI extends BaseAPI {
	/**
	 * Fetches a User based on the provided address.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @returns {Promise<User>} A promise that resolves to a User object.
	 */
	async getUser(address: string): Promise<User> {
		return this.premia.subgraph.getUser(address)
	}

	/**
	 * Fetches an extended User based on the provided address.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @returns {Promise<UserExtended>} A promise that resolves to a UserExtended object.
	 */
	async getUserExtended(address: string): Promise<UserExtended> {
		return this.premia.subgraph.getUserExtended(address)
	}

	/**
	 * Fetches multiple Users based on the provided addresses.
	 *
	 * @param {string[]} addresses - An array of addresses of Users to fetch.
	 * @returns {Promise<User[]>} A promise that resolves to an array of User objects.
	 */
	async getUsers(addresses: string[]): Promise<User[]> {
		return this.premia.subgraph.getUsers(addresses)
	}

	/**
	 * Fetches multiple extended Users based on the provided addresses.
	 *
	 * @param {string[]} addresses - An array of addresses of Users to fetch.
	 * @returns {Promise<UserExtended[]>} A promise that resolves to an array of UserExtended objects.
	 */
	async getUsersExtended(addresses: string[]): Promise<UserExtended[]> {
		return this.premia.subgraph.getUsersExtended(addresses)
	}

	/**
	 * Fetches a UserSnapshot for a specific User at a specific timestamp.
	 *
	 * @param {string} address - The address of the User to fetch the snapshot for.
	 * @param {BigNumberish} timestamp - The timestamp for the snapshot.
	 * @returns {Promise<UserSnapshot>} A promise that resolves to a UserSnapshot object.
	 */
	async getUserSnapshot(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshot> {
		return this.premia.subgraph.getUserSnapshot(address, timestamp)
	}

	/**
	 * Fetches an extended snapshot of a User at a specified timestamp.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @param {BigNumberish} timestamp - The timestamp of the User snapshot.
	 * @returns {Promise<UserSnapshotExtended>} A promise that resolves to a UserSnapshotExtended object.
	 */
	async getUserSnapshotExtended(
		address: string,
		timestamp: BigNumberish
	): Promise<UserSnapshotExtended> {
		return this.premia.subgraph.getUserSnapshotExtended(address, timestamp)
	}

	/**
	 * Fetches multiple snapshots of a User within a specified time frame.
	 *
	 * @method getUserSnapshots
	 * @param {string} address - The address of the User to fetch.
	 * @param {BigNumberish} startTime - The start time of the time frame.
	 * @param {BigNumberish} endTime - The end time of the time frame.
	 * @param {string} [orderBy='timestamp'] - The field to order the snapshots by. Default is 'timestamp'.
	 * @param {string} [order='asc'] - The order of the snapshots. Default is 'asc'.
	 * @param {number} [first=100] - The number of snapshots to fetch. Default is 100.
	 * @param {number} [skip=0] - The number of snapshots to skip. Default is 0.
	 * @returns {Promise<UserSnapshot[]>} A promise that resolves to an array of UserSnapshot objects.
	 */
	async getUserSnapshots(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0
	): Promise<UserSnapshot[]> {
		return this.premia.subgraph.getUserSnapshots(
			address,
			startTime,
			endTime,
			orderBy,
			order,
			first,
			skip
		)
	}

	/**
	 * Fetches multiple extended snapshots of a User within a specified time frame.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @param {BigNumberish} startTime - The start time of the time frame.
	 * @param {BigNumberish} endTime - The end time of the time frame.
	 * @param {string} [orderBy='timestamp'] - The field to order the snapshots by. Default is 'timestamp'.
	 * @param {string} [order='asc'] - The order of the snapshots. Default is 'asc'.
	 * @param {number} [first=100] - The number of snapshots to fetch. Default is 100.
	 * @param {number} [skip=0] - The number of snapshots to skip. Default is 0.
	 * @returns {Promise<UserSnapshotExtended[]>} A promise that resolves to an array of UserSnapshotExtended objects.
	 */
	async getUserSnapshotsExtended(
		address: string,
		startTime: BigNumberish,
		endTime: BigNumberish,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0
	): Promise<UserSnapshotExtended[]> {
		return this.premia.subgraph.getUserSnapshotsExtended(
			address,
			startTime,
			endTime,
			orderBy,
			order,
			first,
			skip
		)
	}

	/**
	 * Fetches a portfolio of a User.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @returns {Promise<UserPortfolio>} A promise that resolves to a UserPortfolio object.
	 */
	async getUserPortfolio(address: string): Promise<UserPortfolio> {
		return this.premia.subgraph.getUserPortfolio(address)
	}

	/**
	 * Fetches an extended portfolio of a User.
	 *
	 * @param {string} address - The address of the User to fetch.
	 * @returns {Promise<UserPortfolioExtended>} A promise that resolves to a UserPortfolioExtended object.
	 */
	async getUserPortfolioExtended(
		address: string
	): Promise<UserPortfolioExtended> {
		return this.premia.subgraph.getUserPortfolioExtended(address)
	}

	/**
	 * Retrieves extended option positions for a given user.
	 *
	 * @param {string} owner - The address of the user for whom to retrieve option positions.
	 * @param {boolean} [isOpen] - Optional parameter that if set to true, only returns open option positions.
	 *                             If set to false, returns closed option positions. If omitted, returns all option positions.
	 *
	 * @returns {Promise<OptionPositionExtended[]>} A promise that resolves to an array of extended option positions for the given user.
	 */
	async getOptionPositionsExtendedForUser(
		owner: string,
		isOpen?: boolean
	): Promise<OptionPositionExtended[]> {
		return this.premia.subgraph.getOptionPositionsExtendedForUser(owner, isOpen)
	}

	/**
	 * Retrieves extended reward option positions for a given user.
	 *
	 * @param {string} owner - The address of the user for whom to retrieve option positions.
	 * @param {number} timestamp - Timestamp to check maturity of the option.
	 * @param {boolean} [isOpen] - Optional parameter that if set to true, only returns open option positions.
	 *                             If set to false, returns closed option positions. If omitted, returns all option positions.
	 *
	 * @returns {Promise<OptionPositionExtended[]>} A promise that resolves to an array of extended option positions for the given user.
	 */
	async getRewardOptionPositionsExtendedForUser(
		owner: string,
		timestamp?: number,
		isOpen?: boolean
	): Promise<OptionPositionExtended[]> {
		return this.premia.subgraph.getRewardOptionPositionsExtendedForUser(
			owner,
			timestamp,
			isOpen
		)
	}

	/**
	 * Retrieves extended liquidity positions for a given user.
	 *
	 * @param {string} owner - The address of the user for whom to retrieve liquidity positions.
	 * @param {OrderType} [orderType] - Optional parameter to filter the positions by order type.
	 *                                  If omitted, returns all liquidity positions for the given user.
	 *
	 * @returns {Promise<LiquidityPositionExtended[]>} A promise that resolves to an array of extended liquidity positions for the given user.
	 */
	async getLiquidityPositionsExtendedForUser(
		owner: string,
		orderType?: OrderType
	): Promise<LiquidityPositionExtended[]> {
		return this.premia.subgraph.getLiquidityPositionsExtendedForUser(
			owner,
			orderType
		)
	}

	/**
	 * Fetches a user's authorized cost setting for automatic settlement.
	 *
	 * @param {string} address - The address of the User to fetch settings for.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a user's authorized cost setting.
	 */
	getAuthorizedCost(address: string, provider?: Provider): Promise<bigint> {
		const settingsContract = this.premia.contracts.getUserSettingsContract(
			provider ?? this.premia.multicallProvider
		)
		return settingsContract.getAuthorizedCost(address)
	}

	/**
	 * Encodes a transaction to set the authorized cost of a User.
	 *
	 * @method encodeSetAuthorizedCost
	 * @param {BigNumberish} authorizedCost - The authorized cost to set.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to an encoded ContractTransaction object.
	 */
	async encodeSetAuthorizedCost(
		authorizedCost: BigNumberish,
		provider?: Provider
	): Promise<ContractTransaction> {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		return settingsContract.setAuthorizedCost.populateTransaction(
			toBigInt(authorizedCost)
		)
	}

	/**
	 * Encodes a transaction to set the authorized cost of a User.
	 *
	 * @method encodeSetAuthorizedCost
	 * @param {BigNumberish} authorizedCost - The authorized cost to set.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeSetAuthorizedCostSync(
		authorizedCost: BigNumberish,
		provider?: Provider
	): TransactionData {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		const data = settingsContract.interface.encodeFunctionData(
			'setAuthorizedCost',
			[toBigInt(authorizedCost)]
		)

		return {
			to: this.premia.contracts.userSettingsAddress,
			data,
		}
	}

	/**
	 * Sets the authorized cost of a User.
	 *
	 * @method setAuthorizedCost
	 * @param {BigNumberish} authorizedCost - The authorized cost to set.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransactionResponse>} A promise that resolves to a ContractTransactionResponse object after the transaction is complete.
	 */
	async setAuthorizedCost(
		authorizedCost: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		return settingsContract.setAuthorizedCost(toBigInt(authorizedCost))
	}

	/**
	 * Fetches a user's authorized actions for a specific operator.
	 *
	 * @param {string} user - The address of the User to fetch settings for.
	 * @param {string} operator - The address of the Operator to fetch authorizations for.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<bigint>} A promise that resolves to a user's authorized actions for a specific operator.
	 */
	getActionAuthorization(
		user: string,
		operator: string,
		provider?: Provider
	): Promise<ActionAuthorization> {
		const settingsContract = this.premia.contracts.getUserSettingsContract(
			provider ?? this.premia.multicallProvider
		)
		return settingsContract.getActionAuthorization(user, operator)
	}

	/**
	 * Encodes a transaction to set the authorized actions for an operator.
	 *
	 * @param {string} operator - The operator to (un)authorize actions for.
	 * @param {bigint[]} actions - The actions to (un)authorize.
	 * @param {boolean[]} authorization - The authorization status of the actions.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to an encoded ContractTransaction object.
	 */
	async encodeSetActionAuthorization(
		operator: string,
		actions: bigint[],
		authorization: boolean[],
		provider?: Provider
	): Promise<ContractTransaction> {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		return settingsContract.setActionAuthorization.populateTransaction(
			operator,
			actions,
			authorization
		)
	}

	/**
	 * Encodes a transaction to set the authorized actions for an operator.
	 *
	 * @param {string} operator - The operator to (un)authorize actions for.
	 * @param {bigint[]} actions - The actions to (un)authorize.
	 * @param {boolean[]} authorization - The authorization status of the actions.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {TransactionData} The encoded transaction data.
	 */
	encodeSetActionAuthorizationSync(
		operator: string,
		actions: bigint[],
		authorization: boolean[],
		provider?: Provider
	): TransactionData {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		const data = settingsContract.interface.encodeFunctionData(
			'setActionAuthorization',
			[operator, actions, authorization]
		)

		return {
			to: this.premia.contracts.userSettingsAddress,
			data,
		}
	}

	/**
	 * Sets the authorized actions for an operator.
	 *
	 * @param {string} operator - The operator to (un)authorize actions for.
	 * @param {bigint[]} actions - The actions to (un)authorize.
	 * @param {boolean[]} authorization - The authorization status of the actions.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to an encoded ContractTransactionResponse object.
	 */
	async setActionAuthorization(
		operator: string,
		actions: bigint[],
		authorization: boolean[],
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		return settingsContract.setActionAuthorization(
			operator,
			actions,
			authorization
		)
	}

	/**
	 * Sets the authorized cost and actions for an operator using multicall.
	 *
	 * @param {string} operator - The operator to (un)authorize actions for.
	 * @param {bigint[]} actions - The actions to (un)authorize.
	 * @param {boolean[]} authorization - The authorization status of the actions.
	 * @param {BigNumberish} authorizedCost - The authorized cost to set.
	 * @param {Provider} provider - The custom provider to use for this call.
	 * @returns {Promise<ContractTransaction>} A promise that resolves to an encoded ContractTransactionResponse object.
	 */
	async updateUserSettings(
		operator: string,
		actions: bigint[],
		authorization: boolean[],
		authorizedCost: BigNumberish,
		provider?: Provider
	): Promise<ContractTransactionResponse> {
		const settingsContract =
			this.premia.contracts.getUserSettingsContract(provider)
		const calls = await Promise.all([
			this.encodeSetAuthorizedCost(authorizedCost, provider),
			this.encodeSetActionAuthorization(
				operator,
				actions,
				authorization,
				provider
			),
		])
		return settingsContract.multicall(calls.map((call) => call.data))
	}
}
