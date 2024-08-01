import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'
import { TokenFragment } from './token'

export const VaultTransactionFragment = gql`
	${VaultFragment}
	${TokenFragment}

	fragment VaultTransaction on VaultTransaction {
		id
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
	}
`
