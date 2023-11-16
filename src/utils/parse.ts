import { BigNumberish, toBigInt } from 'ethers'

import { WAD_DECIMALS } from '../constants'

export function parseDate(value: BigNumberish): Date {
	return new Date(Number(value) * 1000)
}

export function removeLeadingZeros(number: String) {
	return number.replace(/^0+/, '')
}

function toFixed(x: any) {
	if (Math.abs(Number(x)) < 1.0) {
		const e = parseInt(x.toString().split('e-')[1])
		if (e) {
			x *= Math.pow(10, e - 1)
			x = '0.' + new Array(e).join('0') + x.toString().substring(2)
		}
	} else {
		let e = parseInt(x.toString().split('+')[1])
		if (e > 20) {
			e -= 20
			x /= Math.pow(10, e)
			x += new Array(e + 1).join('0')
		}
	}
	return x
}

export function parseBigInt(
	float: BigNumberish,
	decimals: number = Number(WAD_DECIMALS)
): bigint {
	const floatString = isNaN(Number(float))
		? String(float ?? 0)
		: String(toFixed(float))

	let [left, right] = floatString.split('.')

	if (decimals < 0) {
		return toBigInt(left.substring(0, left.length + decimals))
	}

	right = (right ? right.substring(0, decimals) : '').padEnd(decimals, '0')

	return toBigInt(removeLeadingZeros(`${left}${right}`) || '0')
}

export function parseNumber(
	bn: BigNumberish,
	decimals: number = Number(WAD_DECIMALS)
): number {
	const isNegative = bn.toString().startsWith('-')
	const str = String(toFixed(bn)).replace('-', '')
	const left =
		str.length >= decimals ? str.substring(0, str.length - decimals) : 0

	const right =
		str.length >= decimals
			? str.substring(str.length - decimals)
			: str.length < decimals
			? str.padStart(decimals, '0')
			: str.substring(0, str.length)

	return Number(`${isNegative ? '-' : ''}${left}.${right}`)
}
