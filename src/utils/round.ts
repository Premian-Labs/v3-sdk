// Fixes JS float imprecision error
export function truncateFloat(input: number, increment: number): number {
	const orderOfIncrement = Math.floor(Math.log10(increment))
	if (orderOfIncrement < 0) {
		return Number(input.toFixed(-orderOfIncrement))
	} else {
		return Number(input.toFixed(0))
	}
}

export function roundUpTo(initial: number, rounding: number): number {
	return Math.ceil(initial / rounding) * rounding
}
