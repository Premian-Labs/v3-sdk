import { BaseAPI } from './baseAPI'
import { withCache } from '../cache'
import { CacheTTL } from '../constants'
import { Referral } from '../entities'

/**
 * Represents a class for handling operations related to making analytics queries from the subgraph.
 *
 * @class ReferralAPI
 * @extends {BaseAPI}
 */
export class ReferralAPI extends BaseAPI {
	/**
	 * Retrieves daily data for a specific vault using its address.
	 *
	 * This function is cached, meaning that if it is called multiple times within a one minute period,
	 * it will only perform the operation once and then return the cached result for subsequent calls.
	 *
	 * @param {string} user - The address of user to get referrals.
	 * @param {number} [first=1000] - The maximum number of data points to return (default is 1000).
	 * @param {number} [skip=0] - The number of data points to skip from the start of the results (default is 0).
	 *
	 * @returns {Promise<Referral[]>} A promise that resolves to an array of Referral objects, containing referral fees, percent, user and token.
	 */
	@withCache(CacheTTL.MINUTE)
	async getUserReferrals(
		user: string,
		first = 1000,
		skip = 0
	): Promise<Referral[]> {
		return this.premia.subgraph.getUserReferrals(user, first, skip)
	}
}
