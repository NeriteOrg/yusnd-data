import { isAddressEqual, parseAbi, parseAbiItem, type AbiEvent, type Address, type PublicClient } from "viem";
import type { CollIndex } from "@/src/types";
import { getPublicClient } from "@/src/utils/client";
import { getContracts } from "@/src/lib/contracts";
import fs from 'fs';
import path from 'path';
import { ORIGIN_BLOCK } from "@/src/utils/constants";
import { LiquityV2SPStrategy } from "../abi/LiquityV2SPStrategy";
import { StabilityPool } from "../abi/StabilityPool";

export const YUSND_JSON_FILE_NAME = 'yusnd.json';
const logFilePath = path.join(__dirname, `../data/${YUSND_JSON_FILE_NAME}`);

export interface StrategyChangedEventArgs {
  strategy: Address
  change_type: number
}

export interface StrategyChangedEvent {
  blockNumber: string
  transactionHash: string
  args: StrategyChangedEventArgs
}

export interface StrategyReportedEventArgs {
  strategy: Address
  gain: string
  loss: string
  current_debt: string
  protocol_fees: string
  total_fees: string
  total_refunds: string
}

export interface StrategyReportedEvent {
  blockNumber: string
  transactionHash: string
  args: StrategyReportedEventArgs
}

export interface YUSNDJSON {
  updatedAt: string
  strategies: {
    address: Address
    sp: Address
    deposit: string
  }[]
  events: {
    StrategyChanged: {
      lastQueriedFromBlock: string
      lastQueriedToBlock: string
      logs: StrategyChangedEvent[]
    },
    StrategyReported: {
      lastQueriedFromBlock: string
      lastQueriedToBlock: string
      logs: StrategyReportedEvent[]
    }
  }
}

export function getYusndData(): YUSNDJSON {
  let yusndData: YUSNDJSON
  try {
    const lastQueriedData = fs.readFileSync(logFilePath, 'utf-8');
    yusndData = JSON.parse(lastQueriedData) as YUSNDJSON;
  } catch (err) {
    // If file is missing or unreadable, return empty json
    yusndData = {
      events: {
        StrategyChanged: {
          lastQueriedFromBlock: '',
          lastQueriedToBlock: '',
          logs: []
        },
        StrategyReported: {
          lastQueriedFromBlock: '',
          lastQueriedToBlock: '',
          logs: []
        }
      },
      strategies: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return yusndData;
}

function saveYusndData(yusndData: YUSNDJSON) {
  // Ensure the directory exists before writing the file
  const dir = path.dirname(logFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(logFilePath, JSON.stringify(yusndData, null, 2));
  return yusndData;
}

export async function queryAndSaveStrategies() {
  const yusndData = getYusndData();
  const strategies = getStrategiesFromLogs([
    ...yusndData.events.StrategyReported.logs,
    ...yusndData.events.StrategyChanged.logs,
  ]);
  const deposits = await queryStrategyDeposits(strategies);
  yusndData.strategies = deposits;
  yusndData.updatedAt = new Date().toISOString();
  saveYusndData(yusndData);
  console.log(`Saved ${yusndData.strategies.length} strategies to ${logFilePath}`);
  return yusndData;
}

export function getStrategiesFromLogs(logs: (StrategyReportedEvent | StrategyChangedEvent)[]) {
  return Array.from(new Set(logs.map(log => log.args.strategy)));
}

export async function queryStrategyDeposits(strategies: Address[]) {
  const client = getPublicClient();

  const sps = await client.multicall({
    contracts: strategies.map(strategy => ({
      address: strategy,
      abi: LiquityV2SPStrategy as any,
      functionName: 'SP',
    })),
  })

  const stratObj = strategies.map((strategy, index) => ({
    strategy,
    sp: sps[index].result ?? null,
  })).filter(({ sp }) => sp !== null) as { strategy: Address, sp: Address }[]

  const spDeposits = await client.multicall({
    contracts: stratObj.map(({ strategy, sp }) => ({
      address: sp,
      abi: StabilityPool as any,
      functionName: 'deposits',
      args: [strategy],
    })),
  })

  return stratObj.map(({ strategy, sp }, index) => ({
    address: strategy,
    sp,
    deposit: (spDeposits[index].result ?? '').toString(),
  }))
}

export async function queryAndSaveStrategyReportedEventLogs(client?: PublicClient) {
  const logs = await getStrategyReportedEventLogs(client);
  saveYusndData(logs);
  console.log(`Saved ${logs.events.StrategyReported.logs.length} strategy reported events to ${logFilePath}`);
  return logs;
}

export async function getStrategyReportedEventLogs(client?: PublicClient) {
  client = client ?? getPublicClient();
  const contracts = getContracts();

  let lastQueriedDataJson: YUSNDJSON
  try {
    const lastQueriedData = fs.readFileSync(logFilePath, 'utf-8');
    lastQueriedDataJson = JSON.parse(lastQueriedData) as YUSNDJSON;
  } catch (err) {
    // If file is missing or unreadable, return empty json
    lastQueriedDataJson = {
      events: {
        StrategyChanged: {
          lastQueriedFromBlock: '',
          lastQueriedToBlock: '',
          logs: []
        },
        StrategyReported: {
          lastQueriedFromBlock: '',
          lastQueriedToBlock: '',
          logs: []
        }
      },
      strategies: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const fromBlock = lastQueriedDataJson.events.StrategyReported.lastQueriedToBlock ? BigInt(lastQueriedDataJson.events.StrategyReported.lastQueriedToBlock) : ORIGIN_BLOCK;
  const latestBlock = await client.getBlockNumber();
  
  const filter = await client.createEventFilter({
    address: contracts.YearnUSND.address,
    event: parseAbiItem('event StrategyReported(address indexed strategy,uint256 gain,uint256 loss,uint256 current_debt,uint256 protocol_fees,uint256 total_fees,uint256 total_refunds)'),
    strict: true,
    fromBlock,
    toBlock: latestBlock
  })

  const events = await client.getFilterLogs({ filter });

  const recentLogs = events.map(event => {
    return {
      args: {
        strategy: event.args.strategy,
        gain: event.args.gain.toString(),
        loss: event.args.loss.toString(),
        current_debt: event.args.current_debt.toString(),
        protocol_fees: event.args.protocol_fees.toString(),
        total_fees: event.args.total_fees.toString(),
        total_refunds: event.args.total_refunds.toString(),
      },
      blockNumber: event.blockNumber?.toString() ?? '',
      transactionHash: event.transactionHash,
    }
  }) as StrategyReportedEvent[]

  lastQueriedDataJson.events.StrategyReported.logs.push(...recentLogs);
  lastQueriedDataJson.events.StrategyReported.lastQueriedFromBlock = fromBlock.toString();
  lastQueriedDataJson.events.StrategyReported.lastQueriedToBlock = latestBlock.toString();
  lastQueriedDataJson.updatedAt = new Date().toISOString();

  return lastQueriedDataJson;
}