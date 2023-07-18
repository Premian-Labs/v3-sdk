import { DocumentNode, gql } from '@apollo/client/core'
import { BigNumberish } from 'ethers'
import { TransactionFragment } from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class TransactionQuery {
	static transactionId(hash: string): string {
		return hash
	}

	@addFields
	static GetTransaction(subgraph: PremiaSubgraph, hash: string): DocumentNode {
		return gql`
        ${TransactionFragment}

        {
            transaction(id: "${this.transactionId(hash)}") {
                ...Transaction
            }
        }
    `
	}

	@addFields
	static GetTransactions(
		subgraph: PremiaSubgraph,
		filter: string,
		search: string,
		orderBy: string = 'timestamp',
		order: string = 'asc',
		first = 100,
		skip = 0,
		type?: string,
		poolAddress?: string,
		account?: string,
		startTime?: BigNumberish,
		endTime?: BigNumberish,
		searchInput?: string
	): DocumentNode {
		const addressFilter = poolAddress
			? `pool: "${poolAddress.toLowerCase()}",`
			: ''
		const startFilter = startTime ? `timestamp_gte: ${Number(startTime)}` : ''
		const endFilter = endTime ? `timestamp_lte: ${Number(endTime)}` : ''
		const searchInputFilter = searchInput
			? `description_contains: "${searchInput.toUpperCase()}"`
			: ''
		const accountFilter = account ? `user: "${account.toLowerCase()}"` : ''
		const containsName =
			type === 'token'
				? 'tokenSymbol_contains'
				: type === 'pair'
				? 'pairName_contains'
				: type === 'pool'
				? 'poolName_contains'
				: 'vaultName_contains'
		const containsFilter = `${containsName}: "${search}"`

		return gql`
        ${TransactionFragment}
      
        query Transaction {
          transactions(
            first: ${first}
            skip: ${skip}
            orderBy: ${orderBy}
            orderDirection: ${order}
            where: { 
            	sizeUSD_gt: 0, 
				${addressFilter}
            	${startFilter},
            	${endFilter},
            	${searchInputFilter}, 
            	${accountFilter},
                ${containsFilter}
                ${
									filter === 'all'
										? ''
										: `, type${filter === 'options' ? '_not_in' : '_in'}: ${
												filter === 'add'
													? '["POOL_DEPOSIT"]'
													: filter === 'remove'
													? '["POOL_WITHDRAW"]'
													: '["POOL_DEPOSIT", "POOL_WITHDRAW"]'
										  }`
								}
            }
          ) {
            ...Transaction
          }
        }
      `
	}
}
