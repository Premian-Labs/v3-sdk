import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { TokenFragment } from './token'
import { TokenPairFragment } from './tokenPair'
import { VaultFragment } from './vault'

export const TransactionFragment = gql`
	${PoolFragment}
	${VaultFragment}
	${TokenFragment}
	${TokenPairFragment}

	fragment Transaction on Transaction {
		id
		pool {
			...Pool
		}
		vault {
			...Vault
		}
		pair {
			...TokenPair
		}
		origin
		gasUsed
		gasPrice
		timestamp
		block
		logIndex

		type
		action
		description
		size
		sizeETH
		sizeUSD
		user
	}
`
