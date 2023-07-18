import { BigNumberish, FixedNumber, toBigInt } from 'ethers'
import { OrderType } from '../entities'
import { MAX_TICK_PRICE, MIN_TICK_DISTANCE } from '../constants'
import { parseBigInt } from './parse'

const VALID_WIDTHS = [
	1, 2, 4, 5, 8, 10, 16, 20, 25, 32, 40, 50, 64, 80, 100, 125, 128, 160, 200,
	250, 256, 320, 400, 500, 512, 625, 640, 800,
]

function abs(x: FixedNumber): FixedNumber {
	if (x.isNegative()) {
		return x.mul(FixedNumber.fromValue(parseBigInt('-1'), 18))
	}
	return x
}

function closestWidth(
	width: FixedNumber,
	validWidths: FixedNumber[]
): { index: number; value: FixedNumber } {
	let index = 0
	let closest: FixedNumber = validWidths[index]
	let minDiff: FixedNumber = abs(width.sub(validWidths[index]))

	validWidths.forEach((validWidth, i) => {
		let diff = abs(width.sub(validWidth))
		if (diff < minDiff) {
			index = i
			minDiff = diff
			closest = validWidth
		}
	})

	return {
		index: index,
		value: closest,
	}
}

export function snapToValidRange(
	lower: BigNumberish,
	upper: BigNumberish,
	orderType: OrderType
): { lower: bigint; upper: bigint } {
	let _lower = FixedNumber.fromValue(toBigInt(lower), 18)
	let _upper = FixedNumber.fromValue(toBigInt(upper), 18)

	const minTickDistance = FixedNumber.fromValue(MIN_TICK_DISTANCE, 18)
	const validWidths = VALID_WIDTHS.map((el) =>
		FixedNumber.fromValue(parseBigInt(el), 18)
	)
	const width = _upper.sub(_lower).div(minTickDistance)
	const closest = closestWidth(width, validWidths)

	let d = closest.value.mul(minTickDistance)

	if (orderType === OrderType.LONG_COLLATERAL) {
		// If snap goes out of bounds, go to next width size
		if (_upper.sub(d) < minTickDistance) {
			d = validWidths[closest.index - 1].mul(minTickDistance)
		}

		// Snap _lower to 2^n*5^m
		_lower = _upper.sub(d)
	} else {
		let maxTickPrice = FixedNumber.fromValue(MAX_TICK_PRICE, 18)

		// If snap goes out of bounds, go to next width size
		if (_upper.add(d) > maxTickPrice) {
			d = validWidths[closest.index - 1].mul(minTickDistance)
		}

		// Snap _upper to 2^n*5^m
		_upper = _lower.add(d)
	}

	return { lower: _lower.value, upper: _upper.value }
}
