import Premia from '../premia'

/**
 * BaseAPI is an abstract base class providing a common structure for all APIs in the system.
 *
 * All APIs extending this class can access the Premia contract via the 'premia' property.
 *
 * @property {Premia} premia - An instance of the Premia SDK.
 */
export abstract class BaseAPI {
	public readonly premia: Premia

	/**
	 * Construct a new BaseAPI object.
	 * @param {Premia} premia - An instance of the Premia SDK.
	 */
	constructor(premia: Premia) {
		this.premia = premia
	}
}
