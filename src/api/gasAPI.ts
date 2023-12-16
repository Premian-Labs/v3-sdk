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
	async getGasPrice(provider?: JsonRpcProvider): Promise<bigint> {
		const _provider = provider ?? (this.premia.provider as JsonRpcProvider)
		const price = await _provider.send('eth_gasPrice', [])
		return BigInt(price)
	}
}
