import type { CollateralToken, Token } from "../types";

export const NERI: Token = {
  name: "NERI",
  symbol: "NERI" as const,
} as const;

export const USND: Token = {
  name: "USND",
  symbol: "USND" as const,
} as const;

// Collaterals

export const ETH: CollateralToken = {
  collateralRatio: 1.1,
  name: "ETH",
  symbol: "ETH" as const,
} as const;

export const WETH: CollateralToken = {
  collateralRatio: 1.1,
  name: "WETH",
  symbol: "WETH" as const,
} as const;

export const WSTETH: CollateralToken = {
  collateralRatio: 1.1,
  name: "wstETH",
  symbol: "WSTETH" as const,
} as const;

export const RETH: CollateralToken = {
  collateralRatio: 1.1,
  name: "rETH",
  symbol: "RETH" as const,
} as const;

export const RSETH: CollateralToken = {
  collateralRatio: 1.3,
  name: "rsETH",
  symbol: "RSETH" as const,
} as const;

export const WEETH: CollateralToken = {
  collateralRatio: 1.3,
  name: "weETH",
  symbol: "WEETH" as const,
} as const;

export const ARB: CollateralToken = {
  collateralRatio: 1.4,
  name: "ARB",
  symbol: "ARB" as const,
} as const;

export const COMP: CollateralToken = {
  collateralRatio: 1.4,
  name: "COMP",
  symbol: "COMP" as const,
} as const;

export const TBTC: CollateralToken = {
  collateralRatio: 1.15,
  name: "tBTC",
  symbol: "TBTC" as const,
} as const;

export const COLLATERALS: CollateralToken[] = [
  ETH,
  WETH,
  WSTETH,
  RETH,
  RSETH,
  WEETH,
  ARB,
  COMP,
  TBTC,
];

export const TOKENS_BY_SYMBOL = {
  NERI,
  USND,
  ETH,
  WETH,
  WSTETH,
  RETH,
  RSETH,
  WEETH,
  ARB,
  COMP,
  TBTC,
} as const;