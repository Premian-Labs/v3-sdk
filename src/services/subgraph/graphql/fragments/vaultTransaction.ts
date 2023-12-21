import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'
import { UserFragment } from './user'
import { TokenFragment } from './token'

export const VaultTransactionFragment = gql`
	${VaultFragment}
	${UserFragment}
	${TokenFragment}

	fragment VaultTransaction on VaultTransaction {
		id
		registry
		vaultName
		vault {
			...Vault
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
		user {
			...User
		}
	}
`
