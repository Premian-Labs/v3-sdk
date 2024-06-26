import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'

import { OptionPSTransactionFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class OptionPSTransactionQuery {
	static optionPSTransactionId(hash: string): string {
		return hash
	}

	@addFields
	static GetOptionPSTransaction(
		voidnode: PremiaVoidnode,
		hash: string
	): DocumentNode {
		return gql`
        ${OptionPSTransactionFragment}

        {
          optionPSTransaction(id: "${this.optionPSTransactionId(hash)}") {
                ...OptionPSTransaction
            }
        }
    `
	}

	@addFields
	static GetOptionPSTransactions(
		voidnode: PremiaVoidnode,
		search: string,
		orderBy: string,
		order: string,
		limit = 100,
		skip = 0,
		account?: string,
		startTime?: BigNumberish,
		endTime?: BigNumberish,
		searchInput?: string
	): DocumentNode {
		const startFilter = startTime ? `timestamp_gte: ${Number(startTime)},` : ''
		const endFilter = endTime ? `timestamp_lte: ${Number(endTime)},` : ''
		const searchFilter = searchInput
			? `description_contains: "${searchInput.toUpperCase()}",`
			: ''
		const accountFilter = account ? `user: "${account.toLowerCase()}",` : ''

		const containsName = 'tokenSymbol_contains'
		const containsFilter = `${containsName}: "${search}",`

		return gql`
        ${OptionPSTransactionFragment}
    
        query OptionPSTransaction {
            optionPSTransactions(
                limit: ${limit}
                skip: ${skip}
                orderBy: [{
					field: "${orderBy}",
                	direction: "${order}"
				}]
                where: {
                    sizeUSD_gt: 0,
                    ${startFilter}
                    ${endFilter}
                    ${searchFilter}
                    ${accountFilter}
                    ${containsFilter}
                }
            ) {
                ...OptionPSTransaction
            }
        }
    `
	}
}
