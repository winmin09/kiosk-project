import { MenuItem, Mission, SelectedOptions } from './types';

export const MENU_ITEMS: MenuItem[] = [
  // 커피
  {
    id: 'americano',
    name: '아메리카노',
    price: 2500,
    category: 'coffee',
    allowedTemperatures: ['ICE', 'HOT'],
    allowedOptions: ['shot', 'syrup'],
    emoji: '☕',
    color: 'bg-amber-100 border-amber-300 text-amber-900',
  },
  {
    id: 'caffelatte',
    name: '카페라떼',
    price: 3000,
    category: 'coffee',
    allowedTemperatures: ['ICE', 'HOT'],
    allowedOptions: ['shot', 'syrup'],
    emoji: '🥛',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    id: 'vanillalatte',
    name: '바닐라라떼',
    price: 3500,
    category: 'coffee',
    allowedTemperatures: ['ICE', 'HOT'],
    allowedOptions: ['shot', 'syrup'],
    emoji: '🍯',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  // 에이드&티
  {
    id: 'lemonade',
    name: '레몬에이드',
    price: 3500,
    category: 'ade_tea',
    allowedTemperatures: ['ICE'],
    allowedOptions: ['syrup'], // ⚠️ 레몬에이드는 시럽 추가만 가능
    emoji: '🍋',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  },
  {
    id: 'icedtea',
    name: '복숭아 아이스티',
    price: 3000,
    category: 'ade_tea',
    allowedTemperatures: ['ICE'],
    allowedOptions: ['shot'], // ⚠️ 복숭아 아이스티는 샷 추가만 가능
    emoji: '🍑',
    color: 'bg-orange-100 border-orange-300 text-orange-900',
  },
  // 디저트
  {
    id: 'chocolate_cake',
    name: '초코 조각케이크',
    price: 4500,
    category: 'dessert',
    allowedTemperatures: [],
    allowedOptions: [],
    emoji: '🍰',
    color: 'bg-red-50 border-red-200 text-red-900',
  },
  {
    id: 'croffle',
    name: '플레인 크로플',
    price: 3500,
    category: 'dessert',
    allowedTemperatures: [],
    allowedOptions: [],
    emoji: '🧇',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
  },
];

export const OPTION_PRICES = {
  shot: 500,
  syrup: 300,
};

/**
 * Generates a random mission based on the menu and options dataset.
 */
export function generateRandomMission(difficulty: 'EASY' | 'HARD' = 'EASY'): Mission {
  // 1. Dining Type: EAT_IN or TAKE_OUT
  const diningType = Math.random() < 0.5 ? 'EAT_IN' : 'TAKE_OUT';
  const diningTypeText = diningType === 'EAT_IN' ? '먹고가기' : '포장하기';

  // 2. Membership Accumulation Option
  const membershipAccumulate = Math.random() < 0.5;
  const membershipText = membershipAccumulate ? '멤버십 적립하기' : '멤버십 적립안함';

  // 3. Payment Method Option
  const paymentMethods: ('CASH' | 'CARD' | 'POINT')[] = ['CASH', 'CARD', 'POINT'];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const paymentMethodText = 
    paymentMethod === 'CASH' ? '현금 결제' : 
    paymentMethod === 'CARD' ? '카드 결제' : '포인트 결제';

  // 4. Mission Items generation based on difficulty
  const items: { menuItem: MenuItem; temperature: 'ICE' | 'HOT' | null; options: SelectedOptions; quantity: number }[] = [];

  if (difficulty === 'EASY') {
    // Single menu item, quantity 1
    const menuItem = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
    let temperature: 'ICE' | 'HOT' | null = null;
    if (menuItem.allowedTemperatures.length > 0) {
      temperature = menuItem.allowedTemperatures[Math.floor(Math.random() * menuItem.allowedTemperatures.length)];
    }
    const options: SelectedOptions = { shot: false, syrup: false };
    menuItem.allowedOptions.forEach((opt) => {
      if (Math.random() < 0.5) {
        options[opt] = true;
      }
    });

    items.push({
      menuItem,
      temperature,
      options,
      quantity: 1,
    });
  } else {
    // HARD Mode: 50% chance of 'Same menu multiple items', 50% chance of '2 different menus with options'
    const sameMenu = Math.random() < 0.5;
    if (sameMenu) {
      const menuItem = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
      let temperature: 'ICE' | 'HOT' | null = null;
      if (menuItem.allowedTemperatures.length > 0) {
        temperature = menuItem.allowedTemperatures[Math.floor(Math.random() * menuItem.allowedTemperatures.length)];
      }
      const options: SelectedOptions = { shot: false, syrup: false };
      menuItem.allowedOptions.forEach((opt) => {
        if (Math.random() < 0.5) {
          options[opt] = true;
        }
      });
      const quantity = Math.floor(Math.random() * 2) + 2; // 2 or 3 items

      items.push({
        menuItem,
        temperature,
        options,
        quantity,
      });
    } else {
      // 2 different menu items
      const shuffled = [...MENU_ITEMS].sort(() => 0.5 - Math.random());
      const selectedItems = shuffled.slice(0, 2);

      selectedItems.forEach((menuItem) => {
        let temperature: 'ICE' | 'HOT' | null = null;
        if (menuItem.allowedTemperatures.length > 0) {
          temperature = menuItem.allowedTemperatures[Math.floor(Math.random() * menuItem.allowedTemperatures.length)];
        }
        const options: SelectedOptions = { shot: false, syrup: false };
        menuItem.allowedOptions.forEach((opt) => {
          if (Math.random() < 0.5) {
            options[opt] = true;
          }
        });
        const quantity = Math.random() < 0.5 ? 1 : 2; // 1 or 2 items

        items.push({
          menuItem,
          temperature,
          options,
          quantity,
        });
      });
    }
  }

  // 5. Build Description and itemsText
  const itemsDescriptionStrings = items.map((item) => {
    const tempText = item.temperature ? (item.temperature === 'ICE' ? '아이스 ' : '핫 ') : '';
    const optionStrings: string[] = [];
    if (item.options.shot) optionStrings.push('샷 추가');
    if (item.options.syrup) optionStrings.push('시럽 추가');
    const optionsText = optionStrings.length > 0 ? ` (${optionStrings.join(', ')})` : '';
    return `[${tempText}${item.menuItem.name}${optionsText}] ${item.quantity}개`;
  });

  const description = `🎯 [${diningTypeText}]로 ${itemsDescriptionStrings.join(' + ')}를 담고, [${membershipText}] 단계를 거쳐, [${paymentMethodText}]로 최종 결제하세요!`;

  const firstItem = items[0];

  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    diningType,
    difficulty,
    items,
    membershipAccumulate,
    paymentMethod,
    description,
    menuItem: firstItem.menuItem,
    temperature: firstItem.temperature,
    options: firstItem.options,
  };
}
