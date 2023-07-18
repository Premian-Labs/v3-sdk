import { DocumentNode, gql } from '@apollo/client/core'
import {
	VaultRegistryExtendedFragment,
	VaultRegistryFragment,
} from '../fragments'
import { addFields } from '../../../../utils/subgraph'
import PremiaSubgraph from '../../index'

export class VaultRegistryQuery {
	static registryId(address: string): string {
		return address
	}

	@addFields
	static GetVaultRegistry(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${VaultRegistryFragment}

        {
            vaultRegistry(id: "${this.registryId(address)}") {
                ...VaultRegistry
            }
        }
    `
	}

	@addFields
	static GetVaultRegistryExtended(
		subgraph: PremiaSubgraph,
		address: string
	): DocumentNode {
		return gql`
        ${VaultRegistryExtendedFragment}

        {
            vaultRegistry(id: "${this.registryId(address)}") {
                ...VaultRegistryExtended
            }
        }
    `
	}
}
