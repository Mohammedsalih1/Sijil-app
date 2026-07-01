export type NotificationType = "بنكك" | "فوري" | "أوكاش";

export interface Operation {
  id: string;
  operationNumber: string;
  amount: number;
  date: string;
  time: string;
  createdAt: number;
  senderAccount?: string;
  notificationType?: NotificationType;
}

export type FilterType = "today" | "yesterday" | "custom";
