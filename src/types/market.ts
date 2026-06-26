export interface Market {
  id: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate?: string;
}
