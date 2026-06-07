export interface Operation {
  id: string;
  operationNumber: string;
  amount: number;
  date: string;
  time: string;
  createdAt: number;
}

export type FilterType = "today" | "yesterday" | "custom";
