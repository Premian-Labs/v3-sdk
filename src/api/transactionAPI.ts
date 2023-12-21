import { Transaction, VaultTransaction, OptionPSTransaction } from '../entities'
import { BaseAPI } from './baseAPI'

/**
 * TransactionAPI is a class extending the BaseAPI class, providing methods for interacting with transactions and vault
 * transactions. It includes methods for getting a single transaction or vault transaction and for getting multiple
 * transactions or vault transactions with optional parameters for more specific queries.
 *
 * @extends {BaseAPI}
 */
export class TransactionAPI extends BaseAPI {
	/**
	 * Get a single transaction given its hash.
	 *
	 * @param {string} hash - The hash of the transaction to retrieve.
	 *
	 * @returns {Promise<Transaction>} A promise that resolves to the requested transaction.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getTransaction(hash: string): Promise<Transaction> {
		return this.premia.subgraph.getTransaction(hash)
	}

	/**
	 * Get a list of transactions with optional filter, search, order, and pagination parameters.
	 *
	 * @param {string} filter - The filter for the transaction search. (all, add, remove)
	 * @param {string} search - The search query.
	 * @param {string} [orderBy='timestamp'] - The attribute by which to order the transactions.
	 * @param {string} [order='asc'] - The order in which to return the transactions (asc, desc).
	 * @param {number} [first=100] - The maximum number of transactions to return.
	 * @param {number} [skip=0] - The number of transactions to skip.
	 * @param {string} [type] - The type of transactions to return. (token, vault)
	 * @param {string} [account] - The account associated with the transactions to return.
	 * @param {number} [startTime] - The start time for the transactions to return.
	 * @param {number} [endTime] - The end time for the transactions to return.
	 * @param {string} [searchInput] - An additional search input.
	 *
	 * @returns {Promise<Transaction[]>} A promise that resolves to a list of transactions.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0,
		type?: string,
		poolAddress?: string,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<Transaction[]> {
		return this.premia.subgraph.getTransactions(
			filter,
			search,
			orderBy,
			order,
			first,
			skip,
			type,
			poolAddress,
			account,
			startTime,
			endTime,
			searchInput
		)
	}

	/**
	 * Get a single vault transaction given its hash.
	 *
	 * @param {string} hash - The hash of the vault transaction to retrieve.
	 *
	 * @returns {Promise<VaultTransaction>} A promise that resolves to the requested vault transaction.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getVaultTransaction(hash: string): Promise<VaultTransaction> {
		return this.premia.subgraph.getVaultTransaction(hash)
	}

	/**
	 * Get a list of vault transactions with optional filter, search, order, and pagination parameters.
	 *
	 * @param {string} filter - The filter for the vault transaction search. (all, add, remove)
	 * @param {string} search - The search query.
	 * @param {string} [orderBy='timestamp'] - The attribute by which to order the vault transactions.
	 * @param {string} [order='asc'] - The order in which to return the vault transactions (asc, desc).
	 * @param {number} [first=100] - The maximum number of vault transactions to return.
	 * @param {number} [skip=0] - The number of vault transactions to skip.
	 * @param {string} [type] - The type of vault transactions to return.
	 * @param {string} [vaultAddress] - The address of the vault associated with the vault transactions to return.
	 * @param {string} [account] - The account associated with the vault transactions to return.
	 * @param {number} [startTime] - The start time for the vault transactions to return.
	 * @param {number} [endTime] - The end time for the vault transactions to return.
	 * @param {string} [searchInput] - An additional search input.
	 *
	 * @returns {Promise<VaultTransaction[]>} A promise that resolves to a list of vault transactions.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getVaultTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0,
		type?: string,
		vaultAddress?: string,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<VaultTransaction[]> {
		return this.premia.subgraph.getVaultTransactions(
			filter,
			search,
			orderBy,
			order,
			first,
			skip,
			type,
			vaultAddress,
			account,
			startTime,
			endTime,
			searchInput
		)
	}

	/**
	 * Get a single optionPS transaction given its hash.
	 *
	 * @param {string} hash - The hash of the optionPS transaction to retrieve.
	 *
	 * @returns {Promise<OptionPSTransaction>} A promise that resolves to the requested optionPS transaction.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getOptionPSTransaction(hash: string): Promise<OptionPSTransaction> {
		return this.premia.subgraph.getOptionPSTransaction(hash)
	}

	/**
	 * Get a list of optionPS transactions with optional filter, search, order, and pagination parameters.
	 *
	 * @param {string} filter - The filter for the optionPS transaction search. (all, add, remove)
	 * @param {string} search - The search query.
	 * @param {string} [orderBy='timestamp'] - The attribute by which to order the optionPS transactions.
	 * @param {string} [order='asc'] - The order in which to return the vault transactions (asc, desc).
	 * @param {number} [first=100] - The maximum number of optionPS transactions to return.
	 * @param {number} [skip=0] - The number of optionPS transactions to skip.
	 * @param {string} [type] - The type of optionPS transactions to return.
	 * @param {string} [account] - The account associated with the optionPS transactions to return.
	 * @param {number} [startTime] - The start time for the optionPS transactions to return.
	 * @param {number} [endTime] - The end time for the optionPS transactions to return.
	 * @param {string} [searchInput] - An additional search input.
	 *
	 * @returns {Promise<OptionPSTransaction[]>} A promise that resolves to a list of optionPS transactions.
	 *
	 * @remark Uses caching with a one-minute time-to-live.
	 */
	async getOptionPSTransactions(
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0,
		type?: string,
		account?: string,
		startTime?: number,
		endTime?: number,
		searchInput?: string
	): Promise<OptionPSTransaction[]> {
		return this.premia.subgraph.getOptionPSTransactions(
			filter,
			search,
			orderBy,
			order,
			first,
			skip,
			type,
			account,
			startTime,
			endTime,
			searchInput
		)
	}
}
