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
			filter = isOpen ? ', closedAt: null' : ', closedAt_not: null'
		}

		return gql`
			${OptionPositionExtendedFragment}

			{
				optionPositions(where: { 
					owner: "${owner.toLowerCase()}"
					${filter}
				}) {
					...OptionPositionExtended
				}
			}
		`
	}
}
