import { DocumentNode, gql } from '@apollo/client/core'
import { getAddress } from 'ethers'

import { TokenOrAddress } from '../../../../api'
import { addFields } from '../../../../utils/voidnode'
import { VaultExtendedFragment, VaultFragment } from '../fragments'
import { TokenQuery } from './token'
import PremiaVoidnode from '../../index'

export class VaultQuery {
	static vaultId(address: string): string {
		return getAddress(address)
	}

	@addFields
	static GetVault(voidnode: PremiaVoidnode, address: string): DocumentNode {
		return gql`
        ${VaultFragment}
        
        {
            vault(id: "${this.vaultId(address)}") {
                ...Vault
            }
        }
    `
	}

	@addFields
	static GetVaultExtended(
		voidnode: PremiaVoidnode,
		address: string
	): DocumentNode {
		return gql`
        ${VaultExtendedFragment}

        {
            vault(id: "${this.vaultId(address)}") {
                ...VaultExtended
            }
        }
    `
	}

	@addFields
	static GetAllVaultsExtended(voidnode: PremiaVoidnode): DocumentNode {
		return gql`
			${VaultExtendedFragment}

			{
				vaults {
					...VaultExtended
				}
			}
		`
	}

	@addFields
	static GetVaults(
		voidnode: PremiaVoidnode,
		tokenAddress: string
	): DocumentNode {
		return gql`
			${VaultFragment}

			{
				vaults(where: { asset: "${getAddress(tokenAddress)}" }) {
					...Vault
				}
			}
		`
	}

	@addFields
	static GetVaultsExtended(
		voidnode: PremiaVoidnode,
		tokenAddress: string
	): DocumentNode {
		return gql`
        ${VaultExtendedFragment}

        {
            vaults(where: { asset: "${getAddress(tokenAddress)}" }) {
                ...VaultExtended
            }
        }
    `
	}

	@addFields
	static GetVaultsForToken(
		voidnode: PremiaVoidnode,
		_token: TokenOrAddress
	): DocumentNode {
		const token = voidnode._parseTokenAddress(_token)
		return gql`
        ${VaultFragment}
        
        {
            vaults(where: { asset: "${TokenQuery.tokenId(token)}"}) {
                ...Vault
            }
        }
    `
	}

	@addFields
	static GetVaultsExtendedForToken(
		voidnode: PremiaVoidnode,
		_token: TokenOrAddress
	): DocumentNode {
		const token = voidnode._parseTokenAddress(_token)
		return gql`
        ${VaultExtendedFragment}

        {
            vaults(where: { asset: "${TokenQuery.tokenId(token)}" }) {
                ...VaultExtended
            }
        }
    `
	}
}
