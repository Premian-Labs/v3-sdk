/**
 * @interface TickMinimal
 *
 * The TickMinimal interface represents the minimal tick data in an option pool.
 *
 * @property {number} index - The unique identifier for the tick.
 * @property {bigint} price - The price of the asset at this tick. It's expressed as a bigint for precision.
 * @property {bigint} normalizedPrice - The normalized price of the asset, which accounts for factors like inflation or currency conversion.
 */
export interface TickMinimal {
	index: number
	price: bigint
	normalizedPrice: bigint
}

/**
 * @interface Tick
 *
 * The Tick interface represents extensive tick data in an option pool.
 * It includes properties for various financial metrics and pointers to the previous and next ticks.
 *
 * @property {number} index - The unique identifier for the tick.
 * @property {bigint} price - The price associated with this tick.
 * @property {bigint} normalizedPrice - The normalized price of the asset, valued between [0,1].
 * @property {bigint} delta - The tick delta associated with this tick.
 * @property {bigint} externalFeeRate - The rate of the external fee associated with this tick.
 * @property {bigint} shortDelta - The short tick delta associated with this tick.
 * @property {bigint} longDelta - The long tick delta associated with this tick.
 * @property {bigint} counter - A count of events associated with this tick.
 * @property {bigint} longRate - The long liquidity rate, optional.
 * @property {bigint} shortRate - The short liquidity rate, optional.
 * @property {bigint} liquidityRate - The liquidity rate, optional.
 * @property {bigint} impliedVolatility - The implied volatility of derived from this price in the pool.
 * @property {bigint} totalValueLocked - The total value of the asset locked in smart contracts.
 * @property {bigint} totalValueLockedETH - The total value locked, denominated in Ether.
 * @property {bigint} totalValueLockedUSD - The total value locked, denominated in US dollars.
 * @property {TickMinimal} prev - A reference to the previous tick, if it exists.
 * @property {TickMinimal} next - A reference to the next tick, if it exists.
 */
export interface Tick {
	index: number
	price: bigint
	normalizedPrice: bigint

	delta: bigint
	externalFeeRate: bigint
	shortDelta: bigint
	longDelta: bigint
	counter: bigint

	longRate?: bigint
	shortRate?: bigint
	liquidityRate?: bigint

	impliedVolatility: number
	totalValueLocked: bigint
	totalValueLockedETH: bigint
	totalValueLockedUSD: bigint

	prev?: TickMinimal
	next?: TickMinimal
}
