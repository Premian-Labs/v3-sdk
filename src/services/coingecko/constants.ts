export enum CoingeckoTokenId {
  PREMIA = 'premia',
  WETH = 'ethereum',
  ETH = 'ethereum',
  WBTC = 'wrapped-bitcoin',
  BTC = 'wrapped-bitcoin',
  USDC = 'usd-coin',
  DAI = 'dai',
  LINK = 'chainlink',
  ALCX = 'alchemix',
  YFI = 'yearn-finance',
  FTM = 'fantom',
  WFTM = 'fantom',
  OP = 'optimism',
  stETH = 'staked-ether',
  wstETH = 'wrapped-staked-ether',
}

export enum ChainId {
  ETHEREUM = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42,
  POLYGON = 137,
  POLYGON_TESTNET = 80001,
  FANTOM = 250,
  FANTOM_TESTNET = 4002,
  GNOSIS = 100,
  BSC = 56,
  BSC_TESTNET = 97,
  ARBITRUM = 42161,
  ARBITRUM_NOVA = 42170,
  ARBITRUM_TESTNET = 79377087078960,
  AVALANCHE = 43114,
  AVALANCHE_TESTNET = 43113,
  HECO = 128,
  HECO_TESTNET = 256,
  HARMONY = 1666600000,
  HARMONY_TESTNET = 1666700000,
  OKEX = 66,
  OKEX_TESTNET = 65,
  CELO = 42220,
  PALM = 11297108109,
  MOONRIVER = 1285,
  FUSE = 122,
  TELOS = 40,
  MOONBEAM = 1284,
  OPTIMISM = 10,
  KAVA = 2222,
  METIS = 1088,
  BOBA = 288,
  BOBA_AVAX = 43288,
  BOBA_BNB = 56288,
  BTTC = 199,
}

export const CoingeckoChainKey = {
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.ARBITRUM_NOVA]: 'arbitrum-nova',
  [ChainId.ARBITRUM_TESTNET]: 'arbitrum-testnet',
  [ChainId.AVALANCHE]: 'avalanche',
  [ChainId.AVALANCHE_TESTNET]: 'avalance-testnet',
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bsc-testnet',
  [ChainId.CELO]: 'celo',
  [ChainId.ETHEREUM]: 'ethereum',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.FANTOM_TESTNET]: 'fantom-testnet',
  [ChainId.FUSE]: 'fuse',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.HARMONY]: 'harmony',
  [ChainId.HARMONY_TESTNET]: 'harmony-testnet',
  [ChainId.HECO]: 'heco',
  [ChainId.HECO_TESTNET]: 'heco-testnet',
  [ChainId.KOVAN]: 'kovan',
  [ChainId.ROPSTEN]: 'ropsten',
  [ChainId.POLYGON]: 'polygon',
  [ChainId.POLYGON_TESTNET]: 'matic-testnet',
  [ChainId.MOONBEAM]: 'moonbeam',
  [ChainId.MOONRIVER]: 'moonriver',
  [ChainId.OKEX]: 'okex',
  [ChainId.OKEX_TESTNET]: 'okex-testnet',
  [ChainId.PALM]: 'palm',
  [ChainId.RINKEBY]: 'rinkeby',
  [ChainId.TELOS]: 'telos',
  [ChainId.GNOSIS]: 'gnosis',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.KAVA]: 'kava',
  [ChainId.METIS]: 'metis',
  [ChainId.BOBA]: 'boba',
  [ChainId.BOBA_AVAX]: 'boba-avax',
  [ChainId.BOBA_BNB]: 'boba-bnb',
  [ChainId.BTTC]: 'bttc',
}
