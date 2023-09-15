import { BigNumberish, toBigInt } from 'ethers'

export function convertDecimals(
	value: BigNumberish,
	fromDecimals: number | bigint,
	toDecimals: number | bigint
): bigint {
	if (fromDecimals === toDecimals) {
		return toBigInt(value)
	}

	if (fromDecimals > toDecimals) {
		return (
			toBigInt(value) /
			10n ** toBigInt(Number(fromDecimals) - Number(toDecimals))
		)
	}

	return (
		toBigInt(value) * 10n ** toBigInt(Number(toDecimals) - Number(fromDecimals))
	)
}
