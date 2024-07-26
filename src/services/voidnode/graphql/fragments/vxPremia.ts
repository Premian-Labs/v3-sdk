import { gql } from '@apollo/client/core'

import { VaultFragment } from './vault'
import { UserFragment } from './user'

export const VaultVoteFragment = gql`
	${VaultFragment}
	${UserFragment}

	fragment VaultVote on VaultVote {
		_id
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
		_id
		totalVotes
		totalUsers
		timestamp
	}
`

export const UserStakeFragment = gql`
	${UserFragment}

	fragment UserStake on UserStake {
		_id
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
		_id
		totalAmount
		totalLockedAmount
		totalLockPeriod
		timestamp
		totalUsers
		totalPower
	}
`
