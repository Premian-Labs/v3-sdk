import { DocumentNode, gql } from '@apollo/client/core'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'
import { ReferralFragment } from '../fragments/referral'

export class ReferralQuery {
	@addFields
	static GetUserReferrals(
		subgraph: PremiaSubgraph,
		user: string,
		first = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${ReferralFragment}

      query Referral {
        referrals(
          where: { user: "${user.toLowerCase()}"}
          first: ${first}
          skip: ${skip}
        ) {
          ...Referral
        }
      }
    `
	}
}
