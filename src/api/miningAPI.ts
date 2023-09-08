
import {BaseAPI} from "./baseAPI";

/**
 * Represents a class for handling operations related to making liquidity mining.
 *
 * @class MiningAPI
 * @extends {BaseAPI}
 */
export class MiningAPI extends BaseAPI {

    /**
     * Returns a promise containing the amount of pending user rewards for a vault.
     * @param user {string} The address of the user.
     * @param vault {string} The addres of the vault addresses.
     * @returns {Promise<bigint>} Promise the amount of pending user rewards for a vault.
     */
    async getPendingUserRewards(
        {
            user,
            vault
        }: {
            user: string
            vault: string
        }
    ): Promise<bigint> {
        const vaultMiningContract = this.premia.contracts.getVaultMiningContract()
        return vaultMiningContract.getPendingUserRewards(user, vault)
    }
}