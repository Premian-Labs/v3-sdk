import { DocumentNode, gql } from '@apollo/client/core'

import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'
import { ReferralFragment } from '../fragments/referral'

export class ReferralQuery {
	@addFields
	static GetUserReferrals(
		voidnode: PremiaVoidnode,
		user: string,
		limit = 1000,
		skip = 0
	): DocumentNode {
		return gql`
      ${ReferralFragment}

      query Referral {
        referrals(
          where: { user: "${user.toLowerCase()}"}
          limit: ${limit}
          skip: ${skip}
        ) {
          ...Referral
        }
      }
    `
	}
}
