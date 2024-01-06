import { gql } from '@apollo/client/core'

import {
	LiquidityPositionExtendedFragment,
	LiquidityPositionFragment,
} from './liquidityPosition'
import {
	OptionPositionExtendedFragment,
	OptionPositionFragment,
} from './optionPosition'
import {
	VaultPositionExtendedFragment,
	VaultPositionFragment,
} from './vaultPosition'
import { TransactionFragment } from './transaction'
import { VaultTransactionFragment } from './vaultTransaction'
import { ReferralFragment } from './referral'
import { OptionPSTransactionFragment } from './optionPSTransaction'

export const UserFragment = gql`
	fragment User on User {
		id
		address

		claimableFeesETH
		claimableFeesUSD
		totalValueLockedETH
		totalValueLockedUSD

		profitLossETH
		profitLossUSD
		profitLossETHPercent
		profitLossUSDPercent
		poolDepositsETH
		poolDepositsUSD
		poolProfitLossETH
		poolProfitLossUSD
		poolProfitLossETHPercent
		poolProfitLossUSDPercent
		optionDepositsETH
		optionDepositsUSD
		optionProfitLossETH
		optionProfitLossUSD
		optionProfitLossETHPercent
		optionProfitLossUSDPercent
		vaultDepositsETH
		vaultDepositsUSD
		vaultProfitLossETH
		vaultProfitLossUSD
		vaultProfitLossETHPercent
		vaultProfitLossUSDPercent
	}
`

export const UserExtendedFragment = gql`
	${UserFragment}
	${ReferralFragment}

	fragment UserExtended on User {
		...User

		depositsETH
		depositsUSD
		withdrawalsETH
		withdrawalsUSD
		netDepositsETH
		netDepositsUSD
		collateralETH
		collateralUSD
		longsETH
		longsUSD
		shortsETH
		shortsUSD
		volumeETH
		volumeUSD
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenueETH
		feeRevenueUSD
		feesPaidETH
		feesPaidUSD

		primaryReferrer {
			...User
		}
		secondaryReferrer {
			...User
		}
		totalReferrals
		totalSecondaryReferrals
		referralRebatesEarnedETH
		referralRebatesEarnedUSD
		referrals {
			...Referral
		}
		secondaryReferrals {
			...Referral
		}
	}
`

export const UserSnapshotFragment = gql`
	fragment UserSnapshot on UserSnapshot {
		timestamp
		block

		claimableFeesETH
		claimableFeesUSD
		totalValueLockedETH
		totalValueLockedUSD
		netDepositsETH
		netDepositsUSD

		profitLossETH
		profitLossUSD
		profitLossETHPercent
		profitLossUSDPercent
		poolDepositsETH
		poolDepositsUSD
		poolProfitLossETH
		poolProfitLossUSD
		poolProfitLossETHPercent
		poolProfitLossUSDPercent
		optionDepositsETH
		optionDepositsUSD
		optionProfitLossETH
		optionProfitLossUSD
		optionProfitLossETHPercent
		optionProfitLossUSDPercent
		vaultDepositsETH
		vaultDepositsUSD
		vaultProfitLossETH
		vaultProfitLossUSD
		vaultProfitLossETHPercent
		vaultProfitLossUSDPercent
	}
`

export const UserSnapshotExtendedFragment = gql`
	${UserSnapshotFragment}

	fragment UserSnapshotExtended on UserSnapshot {
		...UserSnapshot

		collateralETH
		collateralUSD
		longsETH
		longsUSD
		shortsETH
		shortsUSD
		depositsETH
		depositsUSD
		withdrawalsETH
		withdrawalsUSD
		volumeETH
		volumeUSD
		premiumsPaidETH
		premiumsPaidUSD
		premiumsReceivedETH
		premiumsReceivedUSD
		exercisePayoutsPaidETH
		exercisePayoutsPaidUSD
		exercisePayoutsReceivedETH
		exercisePayoutsReceivedUSD
		feeRevenueETH
		feeRevenueUSD
		feesPaidETH
		feesPaidUSD
	}
`

export const UserPortfolioFragment = gql`
	${UserExtendedFragment}
	${LiquidityPositionFragment}
	${OptionPositionFragment}
	# ${VaultPositionFragment}
	# ${UserSnapshotFragment}
	# ${TransactionFragment}
	# ${VaultTransactionFragment}

	fragment UserPortfolio on User {
		...UserExtended

		liquidityPositions {
			...LiquidityPosition
		}
		optionPositions {
			...OptionPosition
		}
		# vaultPositions {
		# 	...VaultPosition
		# }

		# snapshots {
		# 	...UserSnapshot
		# }
		# poolTransactions {
		# 	...Transaction
		# }
		# vaultTransactions {
		# 	...VaultTransaction
		# }
	}
`

export const UserPortfolioExtendedFragment = gql`
	${UserExtendedFragment}
	${LiquidityPositionExtendedFragment}
	${OptionPositionExtendedFragment}
	${VaultPositionExtendedFragment}
	${UserSnapshotExtendedFragment}
	${TransactionFragment}
	${VaultTransactionFragment}
	${OptionPSTransactionFragment}

	fragment UserPortfolioExtended on User {
		...UserExtended

		liquidityPositions {
			...LiquidityPositionExtended
		}
		optionPositions {
			...OptionPositionExtended
		}
		vaultPositions {
			...VaultPositionExtended
		}

		snapshots {
			...UserSnapshotExtended
		}
		poolTransactions {
			...Transaction
		}
		vaultTransactions {
			...VaultTransaction
		}
		optionPSTransactions {
			...OptionPSTransaction
		}
	}
`

export const TradingCompetitionUserFragment = gql`
	fragment TradingCompetitionUser on TradingCompetitionUser {
		id
		address

		optionDepositsETH
		optionDepositsUSD
		optionProfitLossETH
		optionProfitLossUSD
		optionProfitLossETHPercent
		optionProfitLossUSDPercent
	}
`
