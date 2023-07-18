import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'
import { TokenFragment } from './token'
import { TokenPairFragment } from './tokenPair'

export const VaultTransactionFragment = gql`
	${VaultFragment}
	${TokenFragment}
	${TokenPairFragment}

	fragment VaultTransaction on VaultTransaction {
		id
		registry
		vaultName
		vault {
			...Vault
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
