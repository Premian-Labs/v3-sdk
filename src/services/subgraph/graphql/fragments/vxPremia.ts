import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'
import { UserFragment } from './user'

export const VaultVoteFragment = gql`
	${VaultFragment}
	${UserFragment}

	fragment VaultVote on VaultVote {
		id
		voter {
			...User
		}
		vaultName
		vault {
			...Vault
		}
		amount
		timestamp
		isLast
		version
	}
`

export const VoteHistoryFragment = gql`
	fragment VoteHistory on VoteHistory {
		id
		totalVotes
		totalUsers
		timestamp
	}
`

export const UserStakeFragment = gql`
	${UserFragment}

	fragment UserStake on UserStake {
		id
		amount
		lockedAmount
		lockPeriod
		lockedUntil
		timestamp
		user {
			...User
		}
		votingPower
		voteAmount
		isLast
	}
`

export const StakeHistoryFragment = gql`
	fragment StakeHistory on StakeHistory {
		id
		totalAmount
		totalLockedAmount
		totalLockPeriod
		timestamp
		totalUsers
		totalPower
	}
`
