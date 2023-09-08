import { gql } from '@apollo/client/core'
import { TokenFragment } from './token'
import { UserFragment } from './user'

export const ReferralFragment = gql`
	${UserFragment}
	${TokenFragment}

	fragment Referral on Referral {
		id
		user {
			...User
		}
		timestamp
		token {
			...Token
		}
		tier
		primaryRebate
		primaryRebateETH
		primaryRebateUSD
		secondaryRebate
		secondaryRebateETH
		secondaryRebateUSD
	}
`
