import { JsonRpcProvider } from 'ethers'
import { BaseAPI } from './baseAPI'

/**
 * Represents a class for managing gas in transactions.
 *
 * @class GasAPI
 * @extends {BaseAPI}
 */
export class GasAPI extends BaseAPI {
	/**
	 * Returns a promise containing the gas price.
	 * @returns {Promise<bigint>} Promise containing the gas price.
	 */
	async getGasPrice(): Promise<bigint> {
		const price = await (this.premia.provider as JsonRpcProvider).send(
			'eth_gasPrice',
			[]
		)
		return BigInt(price)
	}
}
