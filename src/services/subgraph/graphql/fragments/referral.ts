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
		primaryReferrer {
			...User
		}
		secondaryReferrer {
			...User
		}
		volumeETH
		volumeUSD
		premiumsETH
		premiumsUSD
		primaryRebatesEarnedETH
		primaryRebatesEarnedUSD
		secondaryRebatesEarnedETH
		secondaryRebatesEarnedUSD
	}
`
