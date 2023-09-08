import { gql } from '@apollo/client/core'
import { TokenFragment } from './token'

export const ReferralFragment = gql`
	${TokenFragment}

	fragment Referral on Referral {
		id
		user {
			address
		}
		primaryReferrer {
			address
		}
		secondaryReferrer {
			address
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
