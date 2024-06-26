import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'

import { VaultTransactionFragment } from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class VaultTransactionQuery {
	static vaultTransactionId(hash: string): string {
		return hash
	}

	@addFields
	static GetVaultTransaction(
		voidnode: PremiaVoidnode,
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
		voidnode: PremiaVoidnode,
		filter: string,
		search: string,
		orderBy: string,
		order: string,
		limit = 100,
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
                limit: ${limit}
                skip: ${skip}
                orderBy: [{
					field: "${orderBy}",
                	direction: "${order}"
				}]
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
