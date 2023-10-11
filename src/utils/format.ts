import { BigNumberish, formatUnits, toBigInt } from 'ethers'
import { MIN_TICK_DISTANCE, WAD_DECIMALS } from '../constants'
import { parseNumber } from './parse'
import { OrderType, TokenType } from '../entities'

export interface TokenIdParams {
	version?: number
	orderType: OrderType
	operator: string
	upper: bigint
	lower: bigint
}

export interface PositionTokenIdParams {
	tokenType: TokenType
	maturity: bigint
	strike: bigint
}

export function precisionForNumber(decimalValue: number) {
	const absoluteValue = Math.abs(decimalValue)
	if (absoluteValue >= 1000) return 0
	if (absoluteValue >= 10) return 2
	if (absoluteValue >= 1) return 3
	if (absoluteValue >= 0.01) return 4
	if (absoluteValue >= 0.001) return 5
	return 6
}

export function formatBigInt(
	value: BigNumberish,
	decimals: number = Number(WAD_DECIMALS)
): string {
	return parseNumber(value, decimals)
		.toLocaleString('fullWide', { useGrouping: false })
		.replace(',', '.')
}

export function formatNumber(
	unformatted: number | string | BigNumberish | bigint | undefined | null,
	precision?: number,
	decimals = 18
) {
	if (!unformatted) return '0'
	if (unformatted === Infinity) return '∞'

	let formatted: string | number = Number(unformatted)

	if (Number(formatted) === 0) return '0'

	if (typeof unformatted === 'bigint') {
		formatted = Number(formatUnits(unformatted.toString(), decimals))
	}

	const decimalPrecision = precision || precisionForNumber(formatted)

	formatted = formatted.toLocaleString(undefined, {
		minimumFractionDigits: decimalPrecision,
		maximumFractionDigits: decimalPrecision,
	})

	if (formatted === '-0') return '0'

	if (decimalPrecision > 2) {
		formatted = formatted.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
	}

	return formatted
}

export function formatCompact(
	unformatted: number | string | BigNumberish | bigint | undefined | null,
	decimals = 18,
	maximumFractionDigits: number | undefined = 3,
	maxPrecision: number | undefined = 4
) {
	if (!unformatted) return '0'
	if (unformatted === Infinity) return '∞'

	const formatter = Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits,
	})

	let formatted: string | number = Number(unformatted)

	if (Number(formatted) === 0) return '0'

	if (typeof unformatted === 'bigint') {
		formatted = Number(formatUnits(unformatted.toString(), decimals))
	}

	return formatter.format(Number(formatted.toPrecision(maxPrecision)))
}

export function formatTokenId({
	version = 1,
	orderType,
	operator,
	upper,
	lower,
}: TokenIdParams) {
	let tokenId = toBigInt(version) << 252n

	tokenId = tokenId + (toBigInt(orderType.valueOf()) << 180n)
	tokenId = tokenId + (toBigInt(operator) << 20n)
	tokenId = tokenId + ((upper / MIN_TICK_DISTANCE) << 10n)
	tokenId = tokenId + lower / MIN_TICK_DISTANCE

	return tokenId
}

export function formatTokenIdPosition({
	tokenType,
	maturity,
	strike,
}: PositionTokenIdParams) {
	let tokenId = toBigInt(tokenType) << 248n

	tokenId = tokenId + (maturity << 128n)
	tokenId = tokenId + strike

	return tokenId
}

/*

let tokenId = BigNumber.from(version).shl(252);
tokenId = tokenId.add(BigNumber.from(orderType.valueOf()).shl(180));
tokenId = tokenId.add(BigNumber.from(operator).shl(20));
tokenId = tokenId.add(upper.div(MIN_TICK_DISTANCE).shl(10));
tokenId = tokenId.add(lower.div(MIN_TICK_DISTANCE));

return tokenId;

*/
