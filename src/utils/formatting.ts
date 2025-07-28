import { getContracts } from "../lib/contracts";
import { COLLATERALS } from "../lib/tokens";
import type { CollateralSymbol, CollIndex, PrefixedTroveId, TroveId, CollateralToken } from "../types";
import { keccak256, encodeAbiParameters, parseAbiParameters, type Address } from "viem";

export function isCollateralSymbol(symbol: string): symbol is CollateralSymbol {
  return (
    symbol === "ETH" 
    || symbol === "WETH" 
    || symbol === "WSTETH"
    || symbol === "RETH" 
    || symbol === "RSETH" 
    || symbol === "WEETH" 
    || symbol === "ARB" 
    || symbol === "COMP" 
    || symbol === "TBTC" 
  );
}

export function isCollIndex(value: unknown): value is CollIndex {
  return typeof value === "number" && value >= 0 && value <= 7;
}

export function isTroveId(value: unknown): value is TroveId {
  return typeof value === "string" && /^0x[0-9a-f]+$/.test(value);
}

export function isPrefixedtroveId(value: unknown): value is PrefixedTroveId {
  return typeof value === "string" && /^[0-9]:0x[0-9a-f]+$/.test(value);
}

export function getTroveId(owner: Address, ownerIndex: bigint | number) {
  return BigInt(keccak256(encodeAbiParameters(
    parseAbiParameters("address, uint256"),
    [owner, BigInt(ownerIndex)],
  )));
}

export function parsePrefixedTroveId(value: PrefixedTroveId): {
  collIndex: CollIndex;
  troveId: TroveId;
} {
  const [collIndex_, troveId] = value.split(":");
  if (!collIndex_ || !troveId) {
    throw new Error(`Invalid prefixed trove ID: ${value}`);
  }
  const collIndex = parseInt(collIndex_, 10);
  if (!isCollIndex(collIndex) || !isTroveId(troveId)) {
    throw new Error(`Invalid prefixed trove ID: ${value}`);
  }
  return { collIndex, troveId };
}

export function getPrefixedTroveId(collIndex: CollIndex, troveId: TroveId): PrefixedTroveId {
  return `${collIndex}:${troveId}`;
}

export function getCollToken(collIndex: CollIndex | null): CollateralToken | null {
  const { collaterals } = getContracts();
  if (collIndex === null) {
    return null;
  }
  return collaterals.map(({ symbol }) => {
    const collateral = COLLATERALS.find((c) => c.symbol === symbol);
    if (!collateral) {
      throw new Error(`Unknown collateral symbol: ${symbol}`);
    }
    return collateral;
  })[collIndex] ?? null;
}

export function getCollIndexFromSymbol(symbol: CollateralSymbol | null): CollIndex | null {
  if (symbol === null) return null;
  const { collaterals } = getContracts();
  const collIndex = collaterals.findIndex((coll) => coll.symbol === symbol);
  return isCollIndex(collIndex) ? collIndex : null;
}