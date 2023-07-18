import { BigNumberish } from 'ethers'

import { TokenPair } from './tokenPair'
import { Vault } from './vault'
import { User } from './user'

export enum VoteVersion {
	V2 = 0,
	VaultV3 = 1,
}

export interface Vote {
	amount: BigNumberish
	version: VoteVersion
	target: string
}

export interface VaultVote {
	voter: string
	vaultName: string
	vault: Vault
	amount: BigNumberish
	timestamp: BigNumberish
	isLast: boolean
	version: BigNumberish
}

export interface PairVote {
	voter: string
	pairName: string
	pair: TokenPair
	amount: BigNumberish
	timestamp: BigNumberish
	isLast: boolean
	version: BigNumberish
}

export interface UserStake {
	amount: BigNumberish
	lockedAmount: BigNumberish
	lockPeriod: BigNumberish
	lockedUntil: BigNumberish
	timestamp: BigNumberish
	user: User
	votingPower: BigNumberish
	voteAmount: BigNumberish
	isLast: boolean
}

export interface StakeHistory {
	totalAmount: BigNumberish
	totalPower: BigNumberish
	totalUsers: BigNumberish
	totalLockPeriod: BigNumberish
	totalLockedAmount: BigNumberish
	timestamp: BigNumberish
}

export interface VoteHistory {
	totalVotes: BigNumberish
	totalUsers: BigNumberish
	timestamp: BigNumberish
}

export interface StakeReward {
	amount: BigNumberish
	user: string
}
