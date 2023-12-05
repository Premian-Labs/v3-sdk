import {OrderType} from "../entities";

export interface TokenIdParams {
    version?: number
    orderType: OrderType
    operator: string
    upper: bigint
    lower: bigint
}