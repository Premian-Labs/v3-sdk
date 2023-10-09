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

export const UserFragment = gql`
	fragment User on User {
		id
		address

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

export const UserExtendedFragment = gql`
	${UserFragment}

	fragment UserExtended on User {
		...User

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

// # ${ReferralFragment}

// # primaryReferrer {
// # 	address
// # }
// # secondaryReferrer {
// # 	address
// # }
// # totalReferrals
// # totalSecondaryReferrals
// # referralRebatesEarnedETH
// # referralRebatesEarnedUSD

// # referrals {
// # 	...Referral
// # }
// # secondaryReferrals {
// # 	...Referral
// # }

export const UserSnapshotFragment = gql`
	${TransactionFragment}

	fragment UserSnapshot on UserSnapshot {
		timestamp
		block
		transaction {
			...Transaction
		}

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
	${VaultPositionFragment}

	fragment UserPortfolio on User {
		...UserExtended

		liquidityPositions {
			...LiquidityPosition
		}
		optionPositions {
			...OptionPosition
		}
		vaultPositions {
			...VaultPosition
		}
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
	}
`
