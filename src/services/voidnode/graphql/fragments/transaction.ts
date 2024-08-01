import { gql } from '@apollo/client/core'

import { PoolFragment } from './pool'
import { TokenPairFragment } from './tokenPair'
import { VaultFragment } from './vault'
import { TokenFragment } from './token'

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
		token {
			...Token
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
	}
`
