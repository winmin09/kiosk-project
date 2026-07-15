export type Category = 'coffee' | 'ade_tea' | 'dessert';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  allowedTemperatures: ('ICE' | 'HOT')[];
  allowedOptions: ('shot' | 'syrup')[];
  emoji: string;
  color: string; // Background accent color for the menu card
}

export interface SelectedOptions {
  shot: boolean;
  syrup: boolean;
}

export interface CartItem {
  id: string; // unique cart item ID
  menuItem: MenuItem;
  temperature: 'ICE' | 'HOT' | null;
  options: SelectedOptions;
  quantity: number;
}

export interface MissionItem {
  menuItem: MenuItem;
  temperature: 'ICE' | 'HOT' | null;
  options: SelectedOptions;
  quantity: number;
}

export interface Mission {
  id: string;
  diningType: 'EAT_IN' | 'TAKE_OUT'; // 매장 vs 포장
  difficulty: 'EASY' | 'HARD';
  items: MissionItem[]; // List of items required for the mission
  membershipAccumulate: boolean; // 적립 여부 (true = 적립 하기, false = 적립 안 하기)
  paymentMethod: 'CASH' | 'CARD' | 'POINT'; // 결제 수단 (현금, 카드, 포인트)
  description: string;
  
  // Keep original single-item fields for backward compatibility/graceful degradation
  menuItem: MenuItem;
  temperature: 'ICE' | 'HOT' | null;
  options: SelectedOptions;
}

export type GameMode = 'HOME' | 'TUTORIAL' | 'GAME' | 'RESULT' | 'PRACTICE';

export type KioskStep = 1 | 2 | 3 | 4 | 5; // Step 1: Dining Select, Step 2: Menu Board, Step 3: Membership Accumulate, Step 4: Payment Method, Step 5: Payment Execution
