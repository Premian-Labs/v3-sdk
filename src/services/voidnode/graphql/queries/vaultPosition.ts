import { DocumentNode, gql } from '@apollo/client/core'

import {
	VaultPositionExtendedFragment,
	VaultPositionFragment,
} from '../fragments'
import { addFields } from '../../../../utils/voidnode'
import PremiaVoidnode from '../../index'

export class VaultPositionQuery {
	static vaultPositionId(owner: string, vaultAddress: string): string {
		return owner.toLowerCase() + ':' + vaultAddress.toLowerCase()
	}

	@addFields
	static GetVaultPositionsExtendedForUser(
		voidnode: PremiaVoidnode,
		owner: string
	): DocumentNode {
		return gql`
        ${VaultPositionExtendedFragment}

        {
            vaultPositions(where: {
            	owner: "${owner.toLowerCase()}"
            }) {
                ...VaultPositionExtended
            }
        }
    `
	}

	@addFields
	static GetVaultPosition(
		voidnode: PremiaVoidnode,
		owner: string,
		vaultAddress: string
	): DocumentNode {
		return gql`
			${VaultPositionFragment}

			{
				vaultPosition(
					id: "${this.vaultPositionId(owner, vaultAddress)}"
				) {
					...VaultPosition
				}
			}
		`
	}

	@addFields
	static GetVaultPositionExtended(
		voidnode: PremiaVoidnode,
		owner: string,
		vaultAddress: string
	): DocumentNode {
		return gql`
			${VaultPositionExtendedFragment}
			
			{
				vaultPosition(id: "${this.vaultPositionId(owner, vaultAddress)}") {
					...VaultPositionExtended
				}
			}
		`
	}
}
