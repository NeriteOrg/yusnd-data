import { createPublicClient, http } from "viem";
import { CHAIN } from "./constants";
import { CHAIN_RPC_URL } from "./env";

export function getPublicClient() {
  return createPublicClient({
    chain: CHAIN,
    transport: http(CHAIN_RPC_URL),
  })
}