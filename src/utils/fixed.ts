import { BigNumberish, FixedNumber } from 'ethers'

export function toFixed(value: BigNumberish): FixedNumber {
	return FixedNumber.fromValue(value)
}
