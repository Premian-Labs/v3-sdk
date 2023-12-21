import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'
import { OptionPSTransactionFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class OptionPSTransactionQuery {
	static optionPSTransactionId(hash: string): string {
		return hash
	}

	@addFields
	static GetOptionPSTransaction(
		subgraph: PremiaSubgraph,
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
		subgraph: PremiaSubgraph,
		search: string,
		orderBy: string,
		order: string,
		first = 100,
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
                first: ${first}
                skip: ${skip}
                orderBy: "${orderBy}"
                orderDirection: "${order}"
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
