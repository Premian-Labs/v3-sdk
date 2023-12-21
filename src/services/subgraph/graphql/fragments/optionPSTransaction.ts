import { gql } from '@apollo/client/core'

import { UserFragment } from './user'
import { OptionPhysicallySettledFragment } from './option'
import { TokenFragment } from './token'

export const OptionPSTransactionFragment = gql`
	${UserFragment}
	${OptionPhysicallySettledFragment}
	${TokenFragment}

	fragment OptionPSTransaction on OptionPSTransaction {
		id
		option {
			...OptionPhysicallySettled
		}
		tokenSymbol
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
