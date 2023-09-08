import { DocumentNode, gql } from '@apollo/client/core'

import {
	LiquidityPositionExtendedFragment,
	LiquidityPositionFragment,
} from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'
import { OrderType } from '../../../../entities'

export class LiquidityPositionQuery {
	static liquidityPositionId(
		owner: string,
		poolAddress: string,
		tokenId: string
	): string {
		return (
			owner.toLowerCase() +
			':' +
			poolAddress.toLowerCase() +
			'/' +
			tokenId.toString()
		)
	}

	@addFields
	static GetLiquidityPosition(
		subgraph: PremiaSubgraph,
		owner: string,
		poolAddress: string,
		tokenId: string
	): DocumentNode {
		return gql`
        ${LiquidityPositionFragment}

        { 
            liquidityPosition(id: "${this.liquidityPositionId(
							owner,
							poolAddress,
							tokenId
						)}") {
                ...LiquidityPosition
            }
        }
    `
	}

	@addFields
	static GetLiquidityPositionExtended(
		subgraph: PremiaSubgraph,
		owner: string,
		poolAddress: string,
		tokenId: string
	): DocumentNode {
		return gql`
        ${LiquidityPositionExtendedFragment}

        {
            liquidityPosition(id: "${this.liquidityPositionId(
							owner,
							poolAddress,
							tokenId
						)}") {
                ...LiquidityPositionExtended
            }
        }
    `
	}

	@addFields
	static GetLiquidityPositionsExtendedForUser(
		subgraph: PremiaSubgraph,
		owner: string,
		orderType?: OrderType
	): DocumentNode {
		let filter
		if (orderType === undefined) {
			filter = ''
		} else {
			if (orderType === OrderType.LONG_COLLATERAL) {
				filter = ', orderType: "LONG_COLLATERAL"'
			} else if (orderType == OrderType.COLLATERAL_SHORT) {
				filter = ', orderType: "COLLATERAL_SHORT"'
			} else if (orderType == OrderType.COLLATERAL_SHORT_USE_PREMIUMS) {
				filter = ', orderType: "COLLATERAL_SHORT_USE_PREMIUMS"'
			}
		}

		return gql`
			${LiquidityPositionExtendedFragment}

			{
				liquidityPositions(
					where: {
						owner: "${owner.toLowerCase()}",
						${filter}
					},
					first: 1000, 
					orderBy: createdAt, 
					orderDirection: desc
				) {
					...LiquidityPositionExtended
				}
			}
		`
	}
}
