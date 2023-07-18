import { BigNumberish, toBigInt } from 'ethers'

export function convertDecimals(
	value: BigNumberish,
	fromDecimals: number,
	toDecimals: number
): bigint {
	if (fromDecimals === toDecimals) {
		return toBigInt(value)
	}

	if (fromDecimals > toDecimals) {
		return toBigInt(value) / 10n ** toBigInt(fromDecimals - toDecimals)
	}

	return toBigInt(value) * 10n ** toBigInt(toDecimals - fromDecimals)
}
