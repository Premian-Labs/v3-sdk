import { ZERO_BI } from '../constants'

export function roundToNearest(value: bigint, nearest: bigint): bigint {
	if (nearest === ZERO_BI) {
		return value
	}

	return (value / nearest) * nearest
}
