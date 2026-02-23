import type { Transaction } from "@/components/TransactionList";

export const MOCK_BALANCE = 12_450.75;
export const MOCK_CHANGE_24H = 2.34;

export const MOCK_CREDIT_SCORE = 782;
export const MOCK_CREDIT_LIMIT = 5000;
export const MOCK_CREDIT_USED = 1230;

export const MOCK_ADDRESS = "GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI";

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    type: "receive",
    amount: 500.0,
    counterparty: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOBD3XDSJ4OPELWI",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: "completed",
  },
  {
    id: "tx-2",
    type: "send",
    amount: 120.5,
    counterparty: "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "completed",
  },
  {
    id: "tx-3",
    type: "credit_use",
    amount: 89.99,
    counterparty: "Amazon Store",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "completed",
  },
  {
    id: "tx-4",
    type: "deposit",
    amount: 2000.0,
    counterparty: "PIX Deposit",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "completed",
  },
  {
    id: "tx-5",
    type: "send",
    amount: 45.0,
    counterparty: "GBDEVU63Y6NTHJQQZIKVTC23NWLQHMWXKBBO3UYP3JPFPFOOSNJHLIAM",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    status: "completed",
  },
  {
    id: "tx-6",
    type: "credit_repay",
    amount: 500.0,
    counterparty: "Credit Repayment",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "completed",
  },
  {
    id: "tx-7",
    type: "receive",
    amount: 3200.0,
    counterparty: "GCFONE23AB7Y6C5YZOMKPBJ6SF4V6TPNWZE2FPCYLWBMQRIFL3JGHKXT",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: "completed",
  },
];

export const MOCK_RISK_METRICS = {
  reserveRatio: 1.02,
  utilizationRate: 0.24,
  protocolTvl: 1_250_000,
  lastCheck: new Date().toISOString(),
  status: "healthy" as "healthy" | "alert",
};

export const MOCK_USER = {
  name: "Lucas Oliveira",
  address: MOCK_ADDRESS,
  cardLastFour: "4829",
};
