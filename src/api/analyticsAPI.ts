import { BaseAPI } from './baseAPI'
import { withCache } from '../cache'
import { CacheTTL } from '../constants'
import { VaultDayData } from '../entities'

/**
 * Represents a class for handling operations related to making analytics queries from the subgraph.
 *
 * @class AnalyticsAPI
 * @extends {BaseAPI}
 */
export class AnalyticsAPI extends BaseAPI {
	/**
	 * Retrieves daily data for a specific vault using its address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} vaultAddress - The address of the vault for which daily data should be retrieved.
	 * @param {number} [startTime=0] - The timestamp (in seconds) from when the data should start being retrieved (default is 0).
	 * @param {number} [first=1000] - The maximum number of data points to return (default is 1000).
	 * @param {number} [skip=0] - The number of data points to skip from the start of the results (default is 0).
	 *
	 * @returns {Promise<VaultDayData[]>} A promise that resolves to an array of VaultDayData objects, containing
	 *                                    daily information about the vault at the specified address.
	 */
	@withCache(CacheTTL.MINUTE)
	async getVaultDayData(
		vaultAddress: string,
		startTime = 0,
		first = 1000,
		skip = 0
	): Promise<VaultDayData[]> {
		return this.premia.subgraph.getVaultDayData(
			vaultAddress,
			startTime,
			first,
			skip
		)
	}
}
