import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'
import { VaultTransactionFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class VaultTransactionQuery {
	static vaultTransactionId(hash: string): string {
		return hash
	}

	@addFields
	static GetVaultTransaction(
		subgraph: PremiaSubgraph,
		hash: string
	): DocumentNode {
		return gql`
        ${VaultTransactionFragment}

        {
            vaultTransaction(id: "${this.vaultTransactionId(hash)}") {
                ...VaultTransaction
            }
        }
    `
	}

	@addFields
	static GetVaultTransactions(
		subgraph: PremiaSubgraph,
		filter: string,
		search: string,
		orderBy: string,
		order: string,
		first = 100,
		skip = 0,
		type?: string,
		vaultAddress?: string,
		account?: string,
		startTime?: BigNumberish,
		endTime?: BigNumberish,
		searchInput?: string
	): DocumentNode {
		const addressFilter = vaultAddress
			? `vault: "${vaultAddress.toLowerCase()}",`
			: ''
		const startFilter = startTime ? `timestamp_gte: ${Number(startTime)},` : ''
		const endFilter = endTime ? `timestamp_lte: ${Number(endTime)},` : ''
		const searchFilter = searchInput
			? `description_contains: "${searchInput.toUpperCase()}",`
			: ''
		const accountFilter = account ? `user: "${account.toLowerCase()}",` : ''

		const containsName =
			type === 'token' ? 'tokenSymbol_contains' : 'vaultName_contains'
		const containsFilter = `${containsName}: "${search}",`

		let transactionTypeFilter = ''
		if (filter === 'add') {
			transactionTypeFilter = 'type_in: ["VAULT_DEPOSIT"]'
		} else if (filter == 'remove') {
			transactionTypeFilter = 'type_in: ["VAULT_WITHDRAW"]'
		}

		return gql`
        ${VaultTransactionFragment}
    
        query VaultTransaction {
            vaultTransactions(
                first: ${first}
                skip: ${skip}
                orderBy: "${orderBy}"
                orderDirection: "${order}"
                where: {
                    sizeUSD_gt: 0,
                    ${addressFilter}
                    ${startFilter}
                    ${endFilter}
                    ${searchFilter}
                    ${accountFilter}
                    ${containsFilter}
                    ${transactionTypeFilter}
                }
            ) {
                ...VaultTransaction
            }
        }
    `
	}
}
