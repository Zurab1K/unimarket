const DEMO_TRANSACTIONS_KEY = "unimarket-demo-transactions";

export type DemoTransactionRecord = {
  id: number;
  listingId: number | null;
  listingTitle: string;
  amountCents: number;
  sellerId: string | null;
  createdAt: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readDemoTransactions(): DemoTransactionRecord[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(DEMO_TRANSACTIONS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function upsertDemoTransaction(record: Omit<DemoTransactionRecord, "id" | "createdAt">) {
  if (!isBrowser()) return;

  const current = readDemoTransactions();
  const existing = current.find((item) => item.listingId === record.listingId);
  const nextRecord: DemoTransactionRecord = {
    ...record,
    id: existing?.id ?? Date.now(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  const next = [
    nextRecord,
    ...current.filter((item) => item.listingId !== record.listingId),
  ];

  window.localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(next));
}
