import { DocumentNode, gql } from '@apollo/client/core'

import {
	OptionPositionExtendedFragment,
	OptionPositionFragment,
} from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class OptionPositionQuery {
	static optionPositionId(owner: string, poolAddress: string): string {
		return owner.toLowerCase() + ':' + poolAddress.toLowerCase()
	}

	@addFields
	static GetOptionPosition(
		subgraph: PremiaSubgraph,
		owner: string,
		poolAddress: string
	): DocumentNode {
		return gql`
        ${OptionPositionFragment}

        {
            optionPosition(id: "${this.optionPositionId(owner, poolAddress)}") {
                ...OptionPosition
            }
        }
    `
	}

	@addFields
	static GetOptionPositionExtended(
		subgraph: PremiaSubgraph,
		owner: string,
		poolAddress: string
	): DocumentNode {
		return gql`
        ${OptionPositionExtendedFragment}

        { 
            optionPosition(id: "${this.optionPositionId(owner, poolAddress)}") {
                ...OptionPositionExtended
            }
        }
    `
	}

	@addFields
	static GetOptionPositionsExtendedForUser(
		subgraph: PremiaSubgraph,
		owner: string,
		isOpen?: boolean
	): DocumentNode {
		let filter
		if (isOpen == undefined) {
			filter = ''
		} else {
			filter = isOpen
				? ', { closedAt: null }, { or: [{ pool_: { isExpiredOTM: false } }, { option_not: null }, { isBuy: false }] }'
				: ', { or: [{ closedAt_not: null }, { pool_: { isExpiredOTM: true }, isBuy: true }] }'
		}

		return gql`
			${OptionPositionExtendedFragment}

			{
				optionPositions(
					where: { 
						and: [
							{ owner: "${owner.toLowerCase()}" }
							${filter}
						]
					},
					first: 1000, 
					orderBy: createdAt, 
					orderDirection: desc
				) {
					...OptionPositionExtended
				}
			}
		`
	}

	@addFields
	static GetRewardOptionPositionsExtendedForUser(
		subgraph: PremiaSubgraph,
		owner: string,
		timestamp?: number,
		isOpen?: boolean
	): DocumentNode {
		let filter = `owner: "${owner.toLowerCase()}", option_not: null`
		if (isOpen !== undefined) {
			filter += isOpen ? ', closedAt: null' : ', closedAt_not: null'
		}
		if (timestamp) {
			filter += `, maturity_lte: ${timestamp}`
		}
		return gql`
			${OptionPositionExtendedFragment}
			{
				optionPositions(
					where: { 
						 ${filter}
					},
					first: 1000, 
					orderBy: createdAt, 
					orderDirection: desc
				) {
					...OptionPositionExtended
				}
			}
		`
	}
}
