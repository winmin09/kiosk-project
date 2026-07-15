import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  HelpCircle, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Smile, 
  AlertTriangle,
  Home,
  CheckCircle,
  Clock,
  BadgeAlert
} from 'lucide-react';

import { MenuItem, CartItem, Mission, GameMode, SelectedOptions, KioskStep } from './types';
import { MENU_ITEMS, OPTION_PRICES, generateRandomMission } from './data';
import { playSound, setMuteState, getMuteState } from './utils/audio';

import OptionsModal from './components/OptionsModal';
import KioskTooltip from './components/KioskTooltip';
import MissionBoard from './components/MissionBoard';

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
}

export default function App() {
  // Game States
  const [gameMode, setGameMode] = useState<GameMode>('HOME');
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [bestScore, setBestScore] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  
  // Completed Steps Trackers
  // 1단계: 매장 선택, 2단계: 메뉴/옵션/수량 정확히 담기, 3단계: 멤버십 적립 미션 수행, 4단계: 지정된 결제수단 클릭, 5단계: 결제 완료
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false]);

  // Difficulty selection states
  const [gameDifficulty, setGameDifficulty] = useState<'EASY' | 'HARD'>('EASY');
  const [showDifficultyPopup, setShowDifficultyPopup] = useState<boolean>(false);

  // Membership state variables
  const [showMembershipPopup, setShowMembershipPopup] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [membershipPhone, setMembershipPhone] = useState<string>('010');

  // Payment Method state variable
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CASH' | 'CARD' | 'POINT' | null>(null);

  // Audio Toggle
  const [muted, setMuted] = useState<boolean>(false);

  // Kiosk State
  const [kioskStep, setKioskStep] = useState<KioskStep>(1); // 1: Dining, 2: Menu board, 3: Membership choice, 4: Payment selection, 5: Payment physical action
  const [diningType, setDiningType] = useState<'EAT_IN' | 'TAKE_OUT' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'coffee' | 'ade_tea' | 'dessert'>('coffee');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Option Modal State (Step 3)
  const [selectedOptionItem, setSelectedOptionItem] = useState<MenuItem | null>(null);

  // Payment Simulation (Step 5)
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [paymentCountdown, setPaymentCompletedCountdown] = useState<number>(5);
  const [waitingNumber, setWaitingNumber] = useState<number>(104);
  const [cardInserted, setCardInserted] = useState<boolean>(false);

  // Cart Alert Dialog
  const [showCartWarning, setShowCartWarning] = useState<boolean>(false);

  // Floating score bursts
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Tutorial Success Dialogue
  const [showTutorialSuccess, setShowTutorialSuccess] = useState<boolean>(false);
  const [showTutorialFailure, setShowTutorialFailure] = useState<boolean>(false);

  // Load Best Score from LocalStorage
  useEffect(() => {
    const savedBest = localStorage.getItem('kiosk_master_best_score');
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10));
    }
    
    // Default mute state
    setMuted(getMuteState());
  }, []);

  // Timer for Step 5 Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameMode === 'PRACTICE') return;

    if (paymentCompleted && paymentCountdown > 0) {
      timer = setTimeout(() => {
        setPaymentCompletedCountdown((prev) => prev - 1);
      }, 1000);
    } else if (paymentCompleted && paymentCountdown === 0) {
      handleGameCompletion();
    }
    return () => clearTimeout(timer);
  }, [paymentCompleted, paymentCountdown, gameMode]);

  // Handle Mute Button
  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    setMuteState(nextMuted);
    // Play test click if unmuting
    if (!nextMuted) {
      setTimeout(() => playSound('click'), 50);
    }
  };

  // Trigger floating +10 or score burst
  const triggerScoreBurst = (text: string, x?: number, y?: number) => {
    const rx = x !== undefined ? x : window.innerWidth / 2 - 40 + (Math.random() * 80 - 40);
    const ry = y !== undefined ? y : window.innerHeight / 2 - 100 + (Math.random() * 60 - 30);
    const newBurst: FloatingText = {
      id: `burst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text,
      x: rx,
      y: ry,
    };
    setFloatingTexts((prev) => [...prev, newBurst]);
    
    // Auto remove after 1.5s
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== newBurst.id));
    }, 1500);
  };

  // Start Tutorial Mode
  const startTutorial = () => {
    playSound('popup');
    const mission = generateRandomMission('EASY');
    setCurrentMission(mission);
    setGameDifficulty('EASY');
    setGameMode('TUTORIAL');
    setScore(0);
    setCompletedSteps([false, false, false, false, false]);
    setKioskStep(1);
    setDiningType(null);
    setCart([]);
    setSelectedCategory('coffee');
    setCardInserted(false);
    setIsPaymentLoading(false);
    setPaymentCompleted(false);
    setShowTutorialSuccess(false);
    setSelectedPaymentMethod(null);
    setMembershipPhone('010');
    setShowKeypad(false);
    setShowMembershipPopup(false);
  };

  // Start Real Game Mode
  const startRealGame = (difficulty?: 'EASY' | 'HARD') => {
    playSound('popup');
    const selectedDiff = difficulty || gameDifficulty;
    setGameDifficulty(selectedDiff);
    const mission = generateRandomMission(selectedDiff);
    setCurrentMission(mission);
    setGameMode('GAME');
    setScore(0);
    setCompletedSteps([false, false, false, false, false]);
    setKioskStep(1);
    setDiningType(null);
    setCart([]);
    setSelectedCategory('coffee');
    setCardInserted(false);
    setIsPaymentLoading(false);
    setPaymentCompleted(false);
    setSelectedPaymentMethod(null);
    setMembershipPhone('010');
    setShowKeypad(false);
    setShowMembershipPopup(false);
  };

  // Start Free Practice Mode
  const startPractice = () => {
    playSound('popup');
    setGameMode('PRACTICE');
    setCurrentMission(null);
    setScore(0);
    setCompletedSteps([false, false, false, false, false]);
    setKioskStep(1);
    setDiningType(null);
    setCart([]);
    setSelectedCategory('coffee');
    setCardInserted(false);
    setIsPaymentLoading(false);
    setPaymentCompleted(false);
    setSelectedPaymentMethod(null);
    setMembershipPhone('010');
    setShowKeypad(false);
    setShowMembershipPopup(false);
  };

  // Exit Game back to Home
  const exitToHome = () => {
    playSound('click');
    setGameMode('HOME');
    setCart([]);
    setDiningType(null);
  };

  // Step 1: Select Dining Type
  const handleSelectDining = (type: 'EAT_IN' | 'TAKE_OUT', e: React.MouseEvent) => {
    playSound('click');
    setDiningType(type);
    
    // Check if it matches mission (In GAME mode only, though we can track completed steps in both)
    if (gameMode === 'PRACTICE') {
      const nextSteps = [...completedSteps];
      nextSteps[0] = true;
      setCompletedSteps(nextSteps);
    } else if (currentMission) {
      const isCorrect = type === currentMission.diningType;
      const nextSteps = [...completedSteps];
      nextSteps[0] = isCorrect;
      setCompletedSteps(nextSteps);

      if (isCorrect && gameMode === 'GAME') {
        // Trigger points
        if (!completedSteps[0]) {
          triggerScoreBurst('+10', e.clientX, e.clientY);
          playSound('success');
        }
      }
    }

    // Transition to step 2 (Main menu panel)
    setTimeout(() => {
      setKioskStep(2);
    }, 300);
  };

  // Step 2: Click Menu Item Card
  const handleSelectMenuItem = (item: MenuItem, e: React.MouseEvent) => {
    playSound('click');
    
    if (currentMission) {
      const isCorrectItem = item.id === currentMission.menuItem.id;
      const nextSteps = [...completedSteps];
      
      // If correct menu item click, reward Step 2 points immediately
      if (isCorrectItem) {
        nextSteps[1] = true;
        setCompletedSteps(nextSteps);
        
        if (gameMode === 'GAME' && !completedSteps[1]) {
          triggerScoreBurst('+10', e.clientX, e.clientY);
          playSound('success');
        }
      }
    }

    // Check if Dessert (No options pop-up)
    if (item.category === 'dessert') {
      // Immediately add to cart (since no temperature or options)
      const options: SelectedOptions = { shot: false, syrup: false };
      addToCartDirectly(item, null, options, e);
    } else {
      // Open Step 3 options popup modal
      setSelectedOptionItem(item);
    }
  };

  // Direct addition to cart (for Desserts, which skip options modal)
  const addToCartDirectly = (item: MenuItem, temp: 'ICE' | 'HOT' | null, opts: SelectedOptions, e: React.MouseEvent) => {
    const cartItemId = `${item.id}-${temp || 'NONE'}-${opts.shot ? 'shot' : 'no'}-${opts.syrup ? 'syrup' : 'no'}`;
    
    // Add or increment
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((i) => i.id === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prevCart, {
          id: cartItemId,
          menuItem: item,
          temperature: temp,
          options: opts,
          quantity: 1
        }];
      }
    });

    // Award Step 3 score immediately for desserts as well, since there's no options to configure!
    if (currentMission && item.id === currentMission.menuItem.id) {
      const nextSteps = [...completedSteps];
      nextSteps[2] = true; // Auto success for Step 3 since it has no options!
      setCompletedSteps(nextSteps);

      if (gameMode === 'GAME' && !completedSteps[2]) {
        setTimeout(() => {
          triggerScoreBurst('+10', window.innerWidth / 2, window.innerHeight / 2);
          playSound('success');
        }, 300);
      }
    }
  };

  // Step 3 Option Modal Confirmed
  const handleConfirmOptions = (temp: 'ICE' | 'HOT' | null, opts: SelectedOptions) => {
    if (!selectedOptionItem) return;

    // Build cart item ID
    const cartItemId = `${selectedOptionItem.id}-${temp || 'NONE'}-${opts.shot ? 'shot' : 'no'}-${opts.syrup ? 'syrup' : 'no'}`;

    // Add or increment
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((i) => i.id === cartItemId);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prevCart, {
          id: cartItemId,
          menuItem: selectedOptionItem,
          temperature: temp,
          options: opts,
          quantity: 1
        }];
      }
    });

    // Check if the configured options match the mission
    if (currentMission && selectedOptionItem.id === currentMission.menuItem.id) {
      const isTempCorrect = temp === currentMission.temperature;
      const isShotCorrect = opts.shot === currentMission.options.shot;
      const isSyrupCorrect = opts.syrup === currentMission.options.syrup;

      const isPerfectOptions = isTempCorrect && isShotCorrect && isSyrupCorrect;
      const nextSteps = [...completedSteps];
      nextSteps[2] = isPerfectOptions;
      setCompletedSteps(nextSteps);

      if (isPerfectOptions && gameMode === 'GAME' && !completedSteps[2]) {
        triggerScoreBurst('+10');
        playSound('success');
      }
    }

    setSelectedOptionItem(null);
  };

  // Step 4 Cart Qty adjustments
  const handleUpdateQty = (cartId: string, delta: number) => {
    playSound('click');
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === cartId) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  };

  // Cart item delete
  const handleDeleteCartItem = (cartId: string) => {
    playSound('click');
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartId));
  };

  // Evaluate if cart contents match the mission perfectly
  const checkCartMatchesMission = (): boolean => {
    if (!currentMission) return false;
    
    const requiredItems = currentMission.items || [];
    if (requiredItems.length === 0) {
      // Fallback for single item
      if (cart.length !== 1) return false;
      const cartItem = cart[0];
      if (cartItem.menuItem.id !== currentMission.menuItem.id) return false;
      if (cartItem.quantity !== 1) return false;
      if (cartItem.temperature !== currentMission.temperature) return false;
      if (cartItem.options.shot !== currentMission.options.shot) return false;
      if (cartItem.options.syrup !== currentMission.options.syrup) return false;
      return true;
    }

    if (cart.length !== requiredItems.length) return false;

    // For each required item, find a match in the cart
    for (const reqItem of requiredItems) {
      const match = cart.find((cItem) => {
        const isIdMatch = cItem.menuItem.id === reqItem.menuItem.id;
        const isTempMatch = cItem.temperature === reqItem.temperature;
        const isShotMatch = cItem.options.shot === reqItem.options.shot;
        const isSyrupMatch = cItem.options.syrup === reqItem.options.syrup;
        const isQtyMatch = cItem.quantity === reqItem.quantity;
        return isIdMatch && isTempMatch && isShotMatch && isSyrupMatch && isQtyMatch;
      });

      if (!match) return false;
    }

    return true;
  };

  // Cart Payment Submission (Step 4 -> Step 5)
  const handlePaymentInitiate = () => {
    playSound('click');
    
    if (cart.length === 0) {
      playSound('fail');
      return;
    }

    if (gameMode === 'PRACTICE') {
      const nextSteps = [...completedSteps];
      nextSteps[1] = true;
      setCompletedSteps(nextSteps);

      setShowMembershipPopup(true);
      setShowKeypad(false);
      setMembershipPhone('010');
      return;
    }

    const isMatch = checkCartMatchesMission();

    // In GAME mode, evaluate Step 2 (메뉴/옵션/수량 정확히 담기) score right when they press Pay
    const nextSteps = [...completedSteps];
    nextSteps[1] = isMatch;
    setCompletedSteps(nextSteps);

    if (isMatch && gameMode === 'GAME') {
      if (!completedSteps[1]) {
        triggerScoreBurst('+10');
        playSound('success');
      }
    }

    // Warn the user in GAME mode if their cart doesn't match the mission
    if (!isMatch && gameMode === 'GAME') {
      playSound('fail');
      setShowCartWarning(true);
    } else {
      // Proceed to membership point accumulation popup
      setShowMembershipPopup(true);
      setShowKeypad(false);
      setMembershipPhone('010');
    }
  };

  const handleForcePay = () => {
    setShowCartWarning(false);
    // Proceed to membership point accumulation popup
    setShowMembershipPopup(true);
    setShowKeypad(false);
    setMembershipPhone('010');
  };

  // Step 3: Membership Accumulation choice
  const handleMembershipChoice = (accumulate: boolean) => {
    playSound('click');
    
    if (gameMode === 'PRACTICE') {
      const nextSteps = [...completedSteps];
      nextSteps[2] = true;
      setCompletedSteps(nextSteps);

      setShowMembershipPopup(false);
      setKioskStep(4);
      return;
    }

    if (!currentMission) return;

    const isCorrect = accumulate === currentMission.membershipAccumulate;
    const nextSteps = [...completedSteps];
    nextSteps[2] = isCorrect;
    setCompletedSteps(nextSteps);

    if (isCorrect && gameMode === 'GAME') {
      triggerScoreBurst('+10');
      playSound('success');
    }

    setShowMembershipPopup(false);
    // Move to payment selection screen (Step 4)
    setKioskStep(4);
  };

  const handleKeypadPress = (digit: string) => {
    playSound('click');
    const clean = membershipPhone.replace(/\D/g, '');
    if (clean.length >= 11) return; // limit to 11 digits
    setMembershipPhone(clean + digit);
  };

  const handleKeypadBackspace = () => {
    playSound('click');
    const clean = membershipPhone.replace(/\D/g, '');
    if (clean.length <= 3) return; // Keep "010" as prefix
    setMembershipPhone(clean.slice(0, -1));
  };

  const formatPhoneNumber = (digits: string) => {
    const clean = digits.replace(/\D/g, '');
    if (clean.length <= 3) {
      return clean;
    } else if (clean.length <= 7) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    } else {
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
    }
  };

  // Step 4: Payment Method Selection
  const handleSelectPaymentMethod = (method: 'CASH' | 'CARD' | 'POINT') => {
    playSound('click');
    setSelectedPaymentMethod(method);

    if (gameMode === 'PRACTICE') {
      const nextSteps = [...completedSteps];
      nextSteps[3] = true;
      setCompletedSteps(nextSteps);

      // Move to physical execution screen (Step 5)
      setKioskStep(5);
      setCardInserted(false);
      setIsPaymentLoading(false);
      setPaymentCompleted(false);
      return;
    }

    if (!currentMission) return;

    const isCorrect = method === currentMission.paymentMethod;
    const nextSteps = [...completedSteps];
    nextSteps[3] = isCorrect;
    setCompletedSteps(nextSteps);

    if (isCorrect && gameMode === 'GAME') {
      triggerScoreBurst('+10');
      playSound('success');
    }

    // Move to physical execution screen (Step 5)
    setKioskStep(5);
    setCardInserted(false);
    setIsPaymentLoading(false);
    setPaymentCompleted(false);
  };

  // Step 5: Cash insertion simulation
  const handleInsertCash = () => {
    if (isPaymentLoading || paymentCompleted) return;
    
    playSound('click');
    setIsPaymentLoading(true);

    // 2.5-second cash counting delay
    setTimeout(() => {
      setIsPaymentLoading(false);
      setPaymentCompleted(true);
      setWaitingNumber(Math.floor(Math.random() * 900) + 100);
      setPaymentCompletedCountdown(5);

      const nextSteps = [...completedSteps];
      nextSteps[4] = true; // Payment completed successfully
      setCompletedSteps(nextSteps);

      if (gameMode === 'GAME' && !completedSteps[4]) {
        triggerScoreBurst('+10');
      }
      
      playSound('complete');
    }, 2500);
  };

  // Step 5: Point scanner simulation
  const handleScanBarcode = () => {
    if (isPaymentLoading || paymentCompleted) return;
    
    playSound('click');
    setIsPaymentLoading(true);

    // 2-second scan beam delay
    setTimeout(() => {
      setIsPaymentLoading(false);
      setPaymentCompleted(true);
      setWaitingNumber(Math.floor(Math.random() * 900) + 100);
      setPaymentCompletedCountdown(5);

      const nextSteps = [...completedSteps];
      nextSteps[4] = true; // Payment completed successfully
      setCompletedSteps(nextSteps);

      if (gameMode === 'GAME' && !completedSteps[4]) {
        triggerScoreBurst('+10');
      }
      
      playSound('complete');
    }, 2000);
  };

  // Interactive Card Insertion
  const handleInsertCard = () => {
    if (isPaymentLoading || paymentCompleted) return;
    
    playSound('click');
    setCardInserted(true);
    setIsPaymentLoading(true);

    // 3-second credit card loading spinner
    setTimeout(() => {
      setIsPaymentLoading(false);
      setPaymentCompleted(true);
      setWaitingNumber(Math.floor(Math.random() * 900) + 100); // 100~999 random number
      setPaymentCompletedCountdown(5);

      // Final step 5 score evaluated!
      const nextSteps = [...completedSteps];
      nextSteps[4] = true; // Payment completion itself is successful!
      setCompletedSteps(nextSteps);

      if (gameMode === 'GAME' && !completedSteps[4]) {
        triggerScoreBurst('+10');
      }
      
      playSound('complete');
    }, 3000);
  };

  // Game completion transition to RESULTS
  const handleGameCompletion = () => {
    if (gameMode === 'TUTORIAL') {
      // Check if they won (did the final cart match the mission?)
      const isPerfectWin = checkCartMatchesMission();
      if (isPerfectWin) {
        playSound('complete');
        setShowTutorialSuccess(true);
      } else {
        playSound('fail');
        setShowTutorialFailure(true);
      }
    } else if (gameMode === 'GAME') {
      // Final Score calculation
      const finalScore = completedSteps.reduce((acc, val) => acc + (val ? 10 : 0), 0);
      setScore(finalScore);

      // Check for High Score
      if (finalScore > bestScore) {
        localStorage.setItem('kiosk_master_best_score', finalScore.toString());
        setBestScore(finalScore);
      }
      
      setGameMode('RESULT');
    }
  };

  // Calculate live score from completed steps
  const liveScore = completedSteps.reduce((acc, val) => acc + (val ? 10 : 0), 0);

  // Total cart item prices
  const totalCartPrice = cart.reduce((sum, item) => {
    const extraPrice = 
      (item.options.shot ? OPTION_PRICES.shot : 0) + 
      (item.options.syrup ? OPTION_PRICES.syrup : 0);
    return sum + (item.menuItem.price + extraPrice) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start text-slate-800 font-sans relative overflow-x-hidden py-4 sm:py-8">
      {/* Floating Score Burst Animations */}
      <AnimatePresence>
        {floatingTexts.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x, scale: 0.8 }}
            animate={{ opacity: 0, y: f.y - 120, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50 text-3xl font-extrabold text-emerald-500 drop-shadow-md font-jua flex items-center gap-1 bg-white border border-emerald-300 px-3 py-1 rounded-full shadow-lg"
          >
            ⭐ {f.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Top Level Audio and Return buttons */}
      <div className="max-w-xl w-full px-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {gameMode !== 'HOME' && gameMode !== 'RESULT' && (
            <button
              onClick={exitToHome}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 rounded-full px-3 py-1.5 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              메인으로
            </button>
          )}
        </div>
        <button
          onClick={toggleMute}
          className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-100 transition-colors cursor-pointer text-gray-600"
          title={muted ? '소리 켜기' : '소리 끄기'}
          id="sound-toggle-btn"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Persistent Mission Board Header when playing */}
      {(gameMode === 'TUTORIAL' || gameMode === 'GAME' || gameMode === 'PRACTICE') && (
        <div className="w-full max-w-xl px-4 mb-4">
          <MissionBoard
            mission={currentMission!}
            mode={gameMode}
            score={liveScore}
            completedSteps={completedSteps}
          />
        </div>
      )}

      {/* MAIN CONTAINER BODY */}
      <div className="w-full max-w-xl px-4 flex-1 flex flex-col items-center justify-start">
        
        {/* SCREEN A: HOME SCREEN */}
        {gameMode === 'HOME' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border-4 border-uiborder rounded-[32px] p-6 sm:p-8 text-center shadow-xl space-y-6 flex flex-col items-center"
            id="home-screen"
          >
            {/* Title Badge */}
            <div className="inline-block px-3.5 py-1.5 bg-cream border border-uiborder text-wood text-[10px] font-black rounded-full uppercase tracking-widest">
              Cafe Kiosk Master
            </div>

            {/* Giant Title */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl font-black text-wood font-jua tracking-wider drop-shadow-sm select-none">
                🍁 키오스크 뿌수기 🍁
              </h1>
              <p className="text-wood-light text-xs font-semibold font-sans">
                다양한 옵션 지옥을 뚫고 키오스크를 마스터해라!
              </p>
            </div>

            {/* Interactive Vector Art of Happy Kiosk Buddy */}
            <div className="relative w-44 h-44 bg-cream border-4 border-uiborder rounded-3xl flex flex-col items-center justify-end overflow-hidden shadow-inner p-2 select-none group">
              {/* Screen Area */}
              <div className="absolute top-3 inset-x-3 h-20 bg-sage rounded-xl border-2 border-sage-hover p-2 flex flex-col items-center justify-center text-white font-jua">
                <div className="text-[10px] font-bold tracking-widest">WELCOME</div>
                <div className="text-2xl animate-bounce-slow mt-1">☕</div>
              </div>
              {/* Blushing Face */}
              <div className="flex gap-8 mb-4 z-10">
                <div className="w-3 h-3 bg-terracotta rounded-full animate-pulse opacity-80" />
                <div className="w-3 h-3 bg-terracotta rounded-full animate-pulse opacity-80" />
              </div>
              {/* Cute Smiling Mouth */}
              <div className="w-6 h-3 border-b-4 border-wood rounded-b-full mb-6 z-10" />
              {/* Card slot glowing */}
              <div className="w-12 h-1.5 bg-terracotta rounded-full animate-pulse mb-1 shadow-[0_0_8px_#D68D71]" />
              <div className="text-[8px] font-mono font-bold text-wood-light">CREDIT CARD PORT</div>
            </div>

            {/* High Score Panel */}
            <div className="w-full bg-mission-bg border-2 border-[#F3E5AB] rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-wood-light uppercase">최고 기록</div>
                  <div className="text-sm font-bold text-wood font-jua">내 베스트 점수</div>
                </div>
              </div>
              <span className="text-2xl font-extrabold text-terracotta font-jua">
                {bestScore}점
              </span>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 pt-2">
              <button
                onClick={startTutorial}
                className="w-full py-4 bg-sage hover:bg-sage-hover text-white font-extrabold rounded-2xl border border-sage/20 shadow-[0_4px_0_#6c8874] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="start-tutorial-btn"
              >
                <span>💡 [초보자용] 튜토리얼 하러가기</span>
              </button>

              <button
                onClick={() => {
                  playSound('popup');
                  setShowDifficultyPopup(true);
                }}
                className="w-full py-4 bg-terracotta hover:bg-terracotta-hover text-white font-extrabold rounded-2xl border border-terracotta/20 shadow-[0_4px_0_#B66F55] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="start-game-btn"
              >
                <span>🎮 [실전 도전] 본게임 하기</span>
              </button>

              <button
                onClick={startPractice}
                className="w-full py-4 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-extrabold rounded-2xl border border-[#4A90E2]/20 shadow-[0_4px_0_#316CA6] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="start-practice-btn"
              >
                <span>✨ [내 맘대로] 자유 연습하기</span>
              </button>
            </div>

            {/* Tips footer */}
            <p className="text-[11px] text-wood-light leading-normal">
              * 카페 사장님의 특이한 음료 주문 지령을 받아 신속 정확하게 주문해 보세요.<br />
              * 본게임에서는 단계별 주문 정확도에 따라 10점씩 점수가 쌓입니다!
            </p>
          </motion.div>
        )}

        {/* SCREEN B: KIOSK INTERFACE (Tutorial & Game Mode) */}
        {(gameMode === 'TUTORIAL' || gameMode === 'GAME' || gameMode === 'PRACTICE') && (
          <div className="w-full flex flex-col items-center">
            
            {/* Visual Kiosk Chassis wrapping the screen content on desktop */}
            <div className="w-full bg-slate-200 border-4 border-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
              
              {/* Kiosk Screen content area */}
              <div className="bg-white min-h-[500px] flex flex-col relative">
                
                {/* KIOSK STEP 1: DINING SELECT SCREEN */}
                {kioskStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 p-6 flex flex-col justify-between bg-cream"
                    id="kiosk-step1"
                  >
                    {/* Welcome banner */}
                    <div className="text-center py-4 space-y-2">
                      <h2 className="text-3xl font-black text-wood font-jua tracking-wide">
                        🥤 KIOSK CAFE
                      </h2>
                      <p className="text-xs text-wood-light font-bold tracking-wide">
                        주문 방식을 선택해 주세요 (Choose Dining Option)
                      </p>
                    </div>

                    {/* Dining options buttons */}
                    <div className="space-y-5 my-auto">
                      
                      {/* EAT IN Option */}
                      <div className="relative">
                        {(() => {
                          const isEatInActive = diningType === 'EAT_IN';
                          const isEatInTarget = gameMode === 'TUTORIAL' && currentMission?.diningType === 'EAT_IN';
                          const btnClass = (isEatInActive || isEatInTarget)
                            ? 'w-full p-6 bg-sage text-white border-3 border-sage shadow-md'
                            : 'w-full p-6 bg-white hover:bg-cream border-3 border-uiborder text-wood shadow-sm';
                          return (
                            <button
                              onClick={(e) => handleSelectDining('EAT_IN', e)}
                              className={`${btnClass} rounded-3xl flex items-center gap-4 text-left transition-all hover:scale-101 active:scale-99 cursor-pointer group`}
                            >
                              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform border border-uiborder/40">
                                🍽️
                              </div>
                              <div>
                                <div className={`text-lg font-extrabold font-jua ${(isEatInActive || isEatInTarget) ? 'text-white' : 'text-wood'}`}>먹고 가기</div>
                                <div className={`text-xs font-semibold ${(isEatInActive || isEatInTarget) ? 'text-white/80' : 'text-wood-light'}`}>매장 컵 또는 머그잔 이용</div>
                              </div>
                              {isEatInTarget && (
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md animate-bounce z-10">
                                  ?
                                </div>
                              )}
                            </button>
                          );
                        })()}
                        
                        {gameMode === 'TUTORIAL' && (
                          <div className="absolute top-2 right-2">
                            <KioskTooltip 
                              text="매장에서 따뜻하게 먹고 마시고 가실 때 선택하는 버튼입니다. 다회용 매장컵으로 음료가 나와요!" 
                              position="left" 
                            />
                          </div>
                        )}
                      </div>

                      {/* TAKE OUT Option */}
                      <div className="relative">
                        {(() => {
                          const isTakeOutActive = diningType === 'TAKE_OUT';
                          const isTakeOutTarget = gameMode === 'TUTORIAL' && currentMission?.diningType === 'TAKE_OUT';
                          const btnClass = (isTakeOutActive || isTakeOutTarget)
                            ? 'w-full p-6 bg-sage text-white border-3 border-sage shadow-md'
                            : 'w-full p-6 bg-white hover:bg-cream border-3 border-uiborder text-wood shadow-sm';
                          return (
                            <button
                              onClick={(e) => handleSelectDining('TAKE_OUT', e)}
                              className={`${btnClass} rounded-3xl flex items-center gap-4 text-left transition-all hover:scale-101 active:scale-99 cursor-pointer group`}
                            >
                              <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:-rotate-6 transition-transform border border-uiborder/40">
                                🛍️
                              </div>
                              <div>
                                <div className={`text-lg font-extrabold font-jua ${(isTakeOutActive || isTakeOutTarget) ? 'text-white' : 'text-wood'}`}>포장하기</div>
                                <div className={`text-xs font-semibold ${(isTakeOutActive || isTakeOutTarget) ? 'text-white/80' : 'text-wood-light'}`}>일회용 컵 및 친환경 비닐 캐리어팩</div>
                              </div>
                              {isTakeOutTarget && (
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md animate-bounce z-10">
                                  ?
                                </div>
                              )}
                            </button>
                          );
                        })()}

                        {gameMode === 'TUTORIAL' && (
                          <div className="absolute top-2 right-2">
                            <KioskTooltip 
                              text="가져가서 야외나 집에서 드실 때 선택하는 버튼입니다. 일회용 캐리어 패키징에 예쁘게 포장해 드립니다!" 
                              position="left" 
                            />
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="text-center text-[10px] text-wood-light font-semibold">
                      화면 아무 곳이나 원하는 버튼을 가볍게 터치해 주세요.
                    </div>
                  </motion.div>
                )}


                {/* KIOSK STEP 2: MAIN MENU & CATEGORY SCREEN */}
                {kioskStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col justify-between"
                    id="kiosk-step2"
                  >
                    {/* Top Tiny Sub-Header */}
                    <div className="bg-cream border-b border-uiborder px-4 py-2.5 flex items-center justify-between text-xs text-wood font-medium">
                      <button
                        onClick={() => {
                          playSound('click');
                          setKioskStep(1);
                        }}
                        className="flex items-center gap-0.5 hover:text-sage transition-colors cursor-pointer text-wood-light font-bold"
                      >
                        <ArrowLeft size={12} />
                        처음으로
                      </button>
                      <div className="flex items-center gap-1 bg-white border border-uiborder px-2.5 py-0.5 rounded-full shadow-sm text-wood text-[10px] font-bold">
                        <span>상태:</span>
                        <strong className="text-wood">
                          {diningType === 'EAT_IN' ? '🍽️ 매장' : '🛍️ 포장'}
                        </strong>
                      </div>
                    </div>

                    {/* Category tabs */}
                    <div className="bg-white border-b-2 border-uiborder grid grid-cols-3 relative">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedCategory('coffee');
                        }}
                        className={`py-3 text-center font-bold text-sm transition-all relative border-b-3 cursor-pointer ${
                          selectedCategory === 'coffee'
                            ? 'text-white bg-sage border-sage font-black'
                            : 'text-wood-light border-transparent hover:text-wood hover:bg-cream/40'
                        }`}
                      >
                        ☕ 커피
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedCategory('ade_tea');
                        }}
                        className={`py-3 text-center font-bold text-sm transition-all relative border-b-3 cursor-pointer ${
                          selectedCategory === 'ade_tea'
                            ? 'text-white bg-sage border-sage font-black'
                            : 'text-wood-light border-transparent hover:text-wood hover:bg-cream/40'
                        }`}
                      >
                        🍹 에이드&티
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          setSelectedCategory('dessert');
                        }}
                        className={`py-3 text-center font-bold text-sm transition-all relative border-b-3 cursor-pointer ${
                          selectedCategory === 'dessert'
                            ? 'text-white bg-sage border-sage font-black'
                            : 'text-wood-light border-transparent hover:text-wood hover:bg-cream/40'
                        }`}
                      >
                        🍰 디저트
                      </button>

                      {gameMode === 'TUTORIAL' && (
                        <div className="absolute top-1 right-1">
                          <KioskTooltip 
                            text="메뉴 종류를 쉽게 둘러볼 수 있도록 분류해 놓은 카테고리 탭 영역입니다." 
                            position="left" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Menu items grid */}
                    <div className="p-4 flex-1 overflow-y-auto max-h-[280px] bg-cream/20">
                      <div className="grid grid-cols-2 gap-3">
                        {MENU_ITEMS.filter((item) => item.category === selectedCategory).map((item) => {
                          const isTarget = gameMode === 'TUTORIAL' && currentMission && item.id === currentMission.menuItem.id;
                          const cardClass = isTarget
                            ? 'border-3 border-sage bg-sage/5 text-wood shadow-md'
                            : 'border-2 border-uiborder bg-white text-wood shadow-sm hover:border-sage/40 hover:bg-cream/20';
                          return (
                            <button
                              key={item.id}
                              onClick={(e) => handleSelectMenuItem(item, e)}
                              className={`rounded-[18px] p-3.5 flex flex-col items-center justify-between transition-all hover:scale-102 active:scale-98 text-center relative cursor-pointer ${cardClass}`}
                            >
                              <div className="w-16 h-16 bg-cream rounded-xl flex items-center justify-center text-3xl mb-2 border border-uiborder/60">
                                {item.emoji}
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-black font-sans leading-tight">
                                  {item.name}
                                </h4>
                                <p className="text-xs font-bold text-terracotta font-mono">
                                  {item.price.toLocaleString()}원
                                </p>
                              </div>

                              {/* Constraints Badges on cards */}
                              {item.id === 'lemonade' && (
                                <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold bg-blue-100 border border-blue-200 text-blue-700 px-1 py-0.5 rounded">아이스고정</span>
                              )}
                              {item.id === 'icedtea' && (
                                <span className="absolute top-1.5 left-1.5 text-[8px] font-extrabold bg-blue-100 border border-blue-200 text-blue-700 px-1 py-0.5 rounded">아이스고정</span>
                              )}

                              {isTarget && (
                                <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md animate-bounce z-10">
                                  ?
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {gameMode === 'TUTORIAL' && (
                        <div className="mt-4 flex justify-center">
                          <KioskTooltip 
                            text="원하는 메뉴의 카드 버튼을 누르면 옵션을 선택할 수 있는 창이 나옵니다. (디저트는 옵션 없이 바로 담겨요!)" 
                            position="top" 
                          />
                        </div>
                      )}
                    </div>

                    {/* STEP 4: CART AREA (Bottom Fixed Dock) */}
                    <div className="border-t-2 border-uiborder bg-white p-3.5 flex flex-col justify-between gap-2.5 shadow-inner rounded-t-3xl">
                      
                      {/* Cart Title & Help */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-wood">🛒 선택한 장바구니</span>
                          <span className="bg-terracotta text-white rounded-full text-[10px] font-bold px-1.5 py-0.2 shrink-0">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        </div>

                        {gameMode === 'TUTORIAL' && (
                          <div className="flex gap-2">
                            <KioskTooltip 
                              text="수량 조절 버튼[+][-]으로 개수를 늘리거나 줄이고, [X]로 삭제할 수 있어요." 
                              position="top" 
                            />
                          </div>
                        )}
                      </div>

                      {/* Cart Items List */}
                      <div className="min-h-[70px] max-h-[110px] overflow-y-auto space-y-1.5 border border-uiborder rounded-xl bg-cream p-2 shadow-inner">
                        {cart.length === 0 ? (
                          <div className="h-[55px] flex items-center justify-center text-[11px] text-wood-light font-medium">
                            담긴 상품이 없습니다. 위 메뉴판에서 음료를 담아보세요!
                          </div>
                        ) : (
                          cart.map((item) => {
                            const extraLabel = [
                              item.temperature ? (item.temperature === 'ICE' ? '아이스' : '핫') : null,
                              item.options.shot ? '샷추가' : null,
                              item.options.syrup ? '시럽추가' : null,
                            ]
                              .filter(Boolean)
                              .join('/');

                            const extraPrice = 
                              (item.options.shot ? OPTION_PRICES.shot : 0) + 
                                (item.options.syrup ? OPTION_PRICES.syrup : 0);
                            const perItemPrice = item.menuItem.price + extraPrice;

                            return (
                              <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-uiborder/60 shadow-sm">
                                <div className="flex-1 pr-2">
                                  <div className="font-extrabold text-wood leading-tight">
                                    {item.menuItem.emoji} {item.menuItem.name}
                                  </div>
                                  {extraLabel && (
                                    <div className="text-[9px] text-wood-light font-bold">
                                      ({extraLabel})
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Qty controls */}
                                  <div className="flex items-center bg-cream rounded-lg border border-uiborder">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, -1)}
                                      className="p-1 hover:bg-uiborder/40 text-wood rounded-l-lg cursor-pointer"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className="w-5 text-center font-extrabold text-[11px] text-wood">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQty(item.id, 1)}
                                      className="p-1 hover:bg-uiborder/40 text-wood rounded-r-lg cursor-pointer"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>

                                  {/* Item Price */}
                                  <span className="w-16 text-right font-bold text-wood text-[10px] font-mono">
                                    {(perItemPrice * item.quantity).toLocaleString()}원
                                  </span>

                                  {/* Delete btn */}
                                  <button
                                    onClick={() => handleDeleteCartItem(item.id)}
                                    className="p-1 hover:bg-terracotta/10 text-terracotta rounded-full cursor-pointer"
                                    title="제거"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Total and Giant Pay Button */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="text-left">
                          <span className="text-[10px] text-wood-light font-black uppercase tracking-wider block">총 결제금액</span>
                          <strong className="text-xl font-black text-wood font-mono tracking-tight leading-none">
                            {totalCartPrice.toLocaleString()}원
                          </strong>
                        </div>

                        <div className="flex-1 max-w-xs relative">
                          <button
                            type="button"
                            onClick={handlePaymentInitiate}
                            disabled={cart.length === 0}
                            className={`w-full py-3 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              cart.length === 0
                                ? 'bg-uiborder text-wood/40 border border-uiborder cursor-not-allowed shadow-none'
                                : 'bg-terracotta hover:bg-terracotta-hover text-white border border-terracotta/20 shadow-[0_4px_0_#B66F55] active:translate-y-0.5 active:shadow-[0_2px_0_#B66F55] animate-bounce-slow'
                            }`}
                          >
                            <CreditCard size={15} />
                            <span>💳 결제하기 (Pay)</span>
                          </button>

                          {gameMode === 'TUTORIAL' && cart.length > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#4A90E2] text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md animate-bounce z-10">
                              ?
                            </div>
                          )}

                          {gameMode === 'TUTORIAL' && (
                            <div className="absolute -top-3 -right-3 z-30">
                              <KioskTooltip 
                                text="담긴 내역과 금액을 최종 확인하고 신용카드로 결제하기 위해 다음 단계로 넘어갑니다." 
                                position="top" 
                                offset={4}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}


                {/* KIOSK STEP 4: PAYMENT METHOD SELECTION */}
                {kioskStep === 4 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 p-6 flex flex-col justify-between bg-cream"
                    id="kiosk-step4"
                  >
                    {/* Header */}
                    <div className="text-center py-4 space-y-2">
                      <h2 className="text-2xl font-black text-wood font-jua tracking-wide">
                        💳 결제 수단 선택 (Payment Method)
                      </h2>
                      <p className="text-xs text-wood-light font-bold tracking-wide">
                        원하시는 결제 수단을 터치해 주세요 (Choose how to pay)
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="space-y-4 my-auto">
                      {/* Cash option */}
                      <button
                        onClick={() => handleSelectPaymentMethod('CASH')}
                        className={`w-full p-4.5 bg-white hover:bg-cream-hover border-3 border-uiborder text-wood rounded-2xl flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-sm group`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">💵</span>
                          <span className="text-sm sm:text-base font-black text-wood font-jua">현금 결제 (Cash)</span>
                        </div>
                        <span className="text-[10px] bg-wood/5 border border-uiborder text-wood-light font-bold px-2.5 py-1 rounded-full group-hover:bg-wood group-hover:text-white transition-colors">지폐 투입</span>
                      </button>

                      {/* Card option */}
                      <button
                        onClick={() => handleSelectPaymentMethod('CARD')}
                        className={`w-full p-4.5 bg-white hover:bg-cream-hover border-3 border-uiborder text-wood rounded-2xl flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-sm group`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">💳</span>
                          <span className="text-sm sm:text-base font-black text-wood font-jua">카드 결제 (Credit Card)</span>
                        </div>
                        <span className="text-[10px] bg-[#4A90E2]/10 border border-[#4A90E2]/30 text-[#4A90E2] font-bold px-2.5 py-1 rounded-full group-hover:bg-[#4A90E2] group-hover:text-white transition-colors">IC 카드</span>
                      </button>

                      {/* Point option */}
                      <button
                        onClick={() => handleSelectPaymentMethod('POINT')}
                        className={`w-full p-4.5 bg-white hover:bg-cream-hover border-3 border-uiborder text-wood rounded-2xl flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-sm group`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">📱</span>
                          <span className="text-sm sm:text-base font-black text-wood font-jua">포인트 결제 (Points)</span>
                        </div>
                        <span className="text-[10px] bg-sage/10 border border-sage/30 text-sage font-bold px-2.5 py-1 rounded-full group-hover:bg-sage group-hover:text-white transition-colors">바코드 스캔</span>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="text-center text-[10px] text-wood-light font-bold p-2 bg-wood/5 rounded-xl border border-uiborder/40">
                      * 미션의 결제 수단과 일치해야 정상 점수(+10점)를 획득합니다.
                    </div>
                  </motion.div>
                )}


                {/* KIOSK STEP 5: PAYMENT SIMULATOR */}
                {kioskStep === 5 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 p-6 flex flex-col justify-between bg-cream/20"
                    id="kiosk-step5"
                  >
                    {/* Header */}
                    <div className="text-center py-2">
                      <h2 className="text-xl font-bold text-wood font-jua">
                        {paymentCompleted ? '🎉 결제 완료' : (
                          selectedPaymentMethod === 'CARD' ? '💳 카드 결제' :
                          selectedPaymentMethod === 'CASH' ? '💵 현금 결제' : '📱 포인트 결제'
                        )}
                      </h2>
                      <p className="text-xs text-wood-light font-bold">
                        {paymentCompleted ? '주문이 주방으로 전송되었습니다!' : (
                          selectedPaymentMethod === 'CARD' ? '리더기에 카드를 삽입해 주세요' :
                          selectedPaymentMethod === 'CASH' ? '지폐 투입구에 현금을 넣어주세요' : '바코드 리더기에 바코드를 대주세요'
                        )}
                      </p>
                    </div>

                    {/* Middle Interaction Graphic */}
                    <div className="flex-1 flex flex-col items-center justify-center my-6 text-center space-y-4">
                      
                      {!cardInserted && !paymentCompleted && !isPaymentLoading && (
                        <>
                          {selectedPaymentMethod === 'CARD' && (
                            <>
                              {/* Credit card hover indicator */}
                              <div className="w-24 h-16 bg-gradient-to-br from-terracotta to-terracotta-hover rounded-xl shadow-lg flex flex-col justify-between p-2 text-white border border-uiborder/40 select-none animate-bounce">
                                <div className="w-6 h-5 bg-[#FDFCF8]/40 rounded-md shadow-inner" />
                                <div className="text-[10px] font-mono tracking-widest text-right font-bold">
                                  *** CARD
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-black text-wood animate-pulse">
                                  하단 리더기를 클릭하여 카드를 꽂아주세요!
                                </p>
                                <p className="text-[11px] text-wood-light leading-normal px-6 font-semibold">
                                  키오스크 본체 기계 아래에 있는 파란색 원형 점멸 구역(카드 투입구)을 터치하면 카드가 삽입됩니다.
                                </p>
                              </div>

                              <button
                                onClick={handleInsertCard}
                                className="px-4 py-2 bg-white hover:bg-cream border border-uiborder text-wood rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
                              >
                                💻 화면 터치로 카드 넣기
                              </button>
                            </>
                          )}

                          {selectedPaymentMethod === 'CASH' && (
                            <>
                              {/* Cash bill hover indicator */}
                              <div className="w-28 h-14 bg-emerald-600 rounded-lg shadow-lg flex flex-col justify-between p-1.5 text-emerald-100 border-2 border-emerald-400 select-none animate-bounce">
                                <div className="border border-emerald-300/30 rounded px-1 py-0.5 text-[8px] font-mono font-bold leading-none flex justify-between">
                                  <span>10000</span>
                                  <span>WON</span>
                                </div>
                                <div className="text-[9px] font-black tracking-widest text-center font-sans">
                                  💵 대 한 민 국 은 행
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-black text-wood animate-pulse">
                                  하단 지폐 투입구를 클릭하여 현금을 넣어주세요!
                                </p>
                                <p className="text-[11px] text-wood-light leading-normal px-6 font-semibold">
                                  키오스크 본체 기계 아래에 있는 노란색 점멸 구역(지폐 투입구)을 터치하면 지폐가 투입됩니다.
                                </p>
                              </div>

                              <button
                                onClick={handleInsertCash}
                                className="px-4 py-2 bg-white hover:bg-cream border border-uiborder text-wood rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
                              >
                                💻 화면 터치로 현금 넣기
                              </button>
                            </>
                          )}

                          {selectedPaymentMethod === 'POINT' && (
                            <>
                              {/* Barcode scan screen indicator */}
                              <div className="w-24 h-24 bg-white border-3 border-uiborder rounded-xl shadow-lg flex flex-col items-center justify-center p-2 select-none animate-bounce relative overflow-hidden">
                                <div className="w-full h-1 bg-red-500 absolute top-12 left-0 animate-pulse" />
                                <span className="text-4xl">📱</span>
                                <span className="text-[9px] font-bold text-wood mt-1.5">||||| BARCODE |||||</span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-sm font-black text-wood animate-pulse">
                                  하단 바코드 스캐너 구역을 터치하세요!
                                </p>
                                <p className="text-[11px] text-wood-light leading-normal px-6 font-semibold">
                                  키오스크 본체 기계 아래에 있는 빨간색 점멸 구역(바코드 스캐너)을 터치하면 멤버십 바코드가 스캔됩니다.
                                </p>
                              </div>

                              <button
                                onClick={handleScanBarcode}
                                className="px-4 py-2 bg-white hover:bg-cream border border-uiborder text-wood rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
                              >
                                💻 화면 터치로 바코드 스캔하기
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {/* Loading Processing state */}
                      {isPaymentLoading && (
                        <div className="space-y-4">
                          {/* Cute loading ring */}
                          <div className="relative w-16 h-16 border-4 border-uiborder border-t-sage rounded-full animate-spin mx-auto" />
                          <div className="space-y-1 animate-pulse">
                            <p className="text-sm font-black text-wood font-jua">
                              {selectedPaymentMethod === 'CARD' ? 'IC 카드 마그네틱 확인 중...' :
                               selectedPaymentMethod === 'CASH' ? '지폐 인식 및 계수 중...' : '바코드 데이터 조회 중...'}
                            </p>
                            <p className="text-xs text-wood-light font-bold font-mono">
                              서버 통신 및 승인 대기 중
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Final Receipt Ticket Output */}
                      {paymentCompleted && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="bg-white border border-dashed border-uiborder rounded-xl p-5 shadow-lg w-full max-w-xs text-left font-mono relative overflow-hidden"
                        >
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sage to-terracotta" />
                          
                          <div className="text-center font-bold text-wood border-b border-dashed border-uiborder/60 pb-2.5 mb-2.5">
                            <div className="text-lg font-black font-jua text-wood tracking-wider">ORDER RECEIPT</div>
                            <div className="text-[9px] text-wood-light mt-0.5">키오스크 카페 영수증</div>
                          </div>

                          <div className="space-y-1.5 text-xs text-wood-light font-sans font-semibold">
                            <div className="flex justify-between">
                              <span className="font-bold text-wood-light/80">주문일시:</span>
                              <span className="text-wood font-medium">2026-07-13 18:00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-wood-light/80">주문형태:</span>
                              <span className="text-wood font-bold">
                                {diningType === 'EAT_IN' ? '🍽️ 매장에서 먹고가기' : '🛍️ 포장해서 가져가기'}
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-b border-dashed border-uiborder/60 py-2.5 my-2.5 space-y-1">
                            {cart.map((item) => (
                              <div key={item.id} className="flex justify-between text-xs text-wood font-sans font-bold">
                                <span>{item.menuItem.name} x {item.quantity}</span>
                                <span>{((item.menuItem.price + (item.options.shot ? OPTION_PRICES.shot : 0) + (item.options.syrup ? OPTION_PRICES.syrup : 0)) * item.quantity).toLocaleString()}원</span>
                              </div>
                            ))}
                          </div>

                          {/* Giant Waiting Number */}
                          <div className="bg-cream p-3 rounded-xl text-center my-3 border border-uiborder/60">
                            <div className="text-[10px] text-wood-light font-bold uppercase tracking-wider">주문 대기 번호</div>
                            <div className="text-3xl font-black text-terracotta font-jua mt-0.5 select-all">
                              {waitingNumber}번
                            </div>
                          </div>

                          <div className="text-center text-[10px] text-sage bg-sage/10 py-1 rounded border border-sage/20 font-bold font-sans">
                            {selectedPaymentMethod === 'CARD' ? '💳 결제 및 신용승인 완료!' :
                             selectedPaymentMethod === 'CASH' ? '💵 현금 결제 및 거스름돈 반환 완료!' : '📱 포인트 결제 완료!'}
                          </div>

                          {/* Bottom Jagged edge mask */}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-white" />
                        </motion.div>
                      )}

                    </div>

                    {/* Bottom Status text & help */}
                    <div className="text-center space-y-3.5">
                      
                      {gameMode === 'TUTORIAL' && (
                        <div className="flex justify-center">
                          <KioskTooltip 
                            text="지정된 결제 방식에 맞게 물리 구역을 클릭하여 최종 결제 및 주문을 마치는 단계입니다." 
                            position="top" 
                          />
                        </div>
                      )}

                      {paymentCompleted ? (
                        gameMode === 'PRACTICE' ? (
                          <div className="space-y-2 w-full">
                            <div className="bg-sage/15 border border-sage/45 p-3 rounded-2xl text-xs text-sage font-black flex items-center justify-center gap-2">
                              🎉 연습 모드 주문 완료! 자유 연습이 끝났습니다.
                            </div>
                            <button
                              onClick={exitToHome}
                              className="w-full py-3.5 bg-sage hover:bg-sage-hover text-white font-extrabold rounded-2xl border border-sage/20 shadow-[0_4px_0_#5a7561] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                            >
                              🏠 연습 완료! 메인 화면으로 돌아가기
                            </button>
                          </div>
                        ) : (
                          <div className="bg-mission-bg border border-[#F3E5AB] p-2.5 rounded-2xl text-xs text-wood font-bold animate-pulse flex items-center justify-center gap-2">
                            <Clock size={14} className="text-terracotta animate-spin" />
                            <span>잠시 후 {paymentCountdown}초 뒤 결과 리포트 화면으로 이동합니다...</span>
                          </div>
                        )
                      ) : (
                        <div className="text-[10px] text-wood-light font-semibold">
                          * 실제 결제나 청구는 일어나지 않는 가상 시뮬레이터입니다.
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}

              </div>

              {/* KIOSK PHYSICAL LOWER CHASSIS FRAME */}
              <div className="bg-[#E5E1D8] border-t-4 border-[#C8C2B5] p-4 flex flex-col items-center gap-3 relative select-none">
                
                {/* Visual Label */}
                <span className="text-[8px] font-bold text-wood-light tracking-widest uppercase block">
                  Kiosk Physical Hardware Interface
                </span>

                <div className="w-full grid grid-cols-4 gap-2 px-2">
                  
                  {/* Slot 1: Receipt Printer slot */}
                  <div className="flex flex-col items-center">
                    <div className="w-full h-2 bg-wood rounded-full shadow-inner border border-uiborder/60" />
                    <span className="text-[8px] text-wood-light font-bold mt-1 text-center">🧾 영수증 (Receipt)</span>
                  </div>

                  {/* Slot 2: Glowing Credit Card Reader Port */}
                  <button
                    type="button"
                    onClick={handleInsertCard}
                    disabled={kioskStep !== 5 || selectedPaymentMethod !== 'CARD' || cardInserted}
                    className={`flex flex-col items-center cursor-pointer focus:outline-none group ${
                      kioskStep === 5 && selectedPaymentMethod === 'CARD' && !cardInserted ? 'animate-bounce' : ''
                    }`}
                  >
                    <div className={`w-full h-2 rounded bg-wood border transition-all duration-300 ${
                      kioskStep === 5 && selectedPaymentMethod === 'CARD' && !cardInserted 
                        ? 'bg-[#4A90E2] border-white shadow-[0_0_12px_#4A90E2]' 
                        : cardInserted && selectedPaymentMethod === 'CARD'
                          ? 'bg-sage border-sage shadow-[0_0_10px_#7E9A86]' 
                          : 'bg-wood border-uiborder/40'
                    }`} />
                    <span className={`text-[7px] sm:text-[8px] font-bold mt-1 text-center tracking-tight transition-colors ${
                      kioskStep === 5 && selectedPaymentMethod === 'CARD' && !cardInserted 
                        ? 'text-[#4A90E2] font-extrabold animate-pulse' 
                        : cardInserted && selectedPaymentMethod === 'CARD'
                          ? 'text-sage font-black' 
                          : 'text-wood-light'
                    }`}>
                      {cardInserted && selectedPaymentMethod === 'CARD' ? '🟢 카드 꽂힘' : '🔵 카드 투입'}
                    </span>
                  </button>

                  {/* Slot 3: Glowing Cash Slot */}
                  <button
                    type="button"
                    onClick={handleInsertCash}
                    disabled={kioskStep !== 5 || selectedPaymentMethod !== 'CASH' || paymentCompleted}
                    className={`flex flex-col items-center cursor-pointer focus:outline-none group ${
                      kioskStep === 5 && selectedPaymentMethod === 'CASH' && !paymentCompleted ? 'animate-bounce' : ''
                    }`}
                  >
                    <div className={`w-full h-2 rounded bg-wood border transition-all duration-300 ${
                      kioskStep === 5 && selectedPaymentMethod === 'CASH' && !paymentCompleted
                        ? 'bg-yellow-400 border-white shadow-[0_0_12px_#F59E0B]'
                        : paymentCompleted && selectedPaymentMethod === 'CASH'
                          ? 'bg-sage border-sage shadow-[0_0_10px_#7E9A86]'
                          : 'bg-wood border-uiborder/40'
                    }`} />
                    <span className={`text-[7px] sm:text-[8px] font-bold mt-1 text-center tracking-tight transition-colors ${
                      kioskStep === 5 && selectedPaymentMethod === 'CASH' && !paymentCompleted
                        ? 'text-yellow-600 font-extrabold animate-pulse'
                        : paymentCompleted && selectedPaymentMethod === 'CASH'
                          ? 'text-sage font-black'
                          : 'text-wood-light'
                    }`}>
                      {paymentCompleted && selectedPaymentMethod === 'CASH' ? '🟢 지폐 투입됨' : '🟡 지폐 투입'}
                    </span>
                  </button>

                  {/* Slot 4: Glowing Barcode Scanner */}
                  <button
                    type="button"
                    onClick={handleScanBarcode}
                    disabled={kioskStep !== 5 || selectedPaymentMethod !== 'POINT' || paymentCompleted}
                    className={`flex flex-col items-center cursor-pointer focus:outline-none group ${
                      kioskStep === 5 && selectedPaymentMethod === 'POINT' && !paymentCompleted ? 'animate-bounce' : ''
                    }`}
                  >
                    <div className={`w-full h-2 rounded bg-wood border transition-all duration-300 relative overflow-hidden ${
                      kioskStep === 5 && selectedPaymentMethod === 'POINT' && !paymentCompleted
                        ? 'bg-red-500 border-white shadow-[0_0_12px_#EF4444]'
                        : paymentCompleted && selectedPaymentMethod === 'POINT'
                          ? 'bg-sage border-sage shadow-[0_0_10px_#7E9A86]'
                          : 'bg-wood border-uiborder/40'
                    }`}>
                      {kioskStep === 5 && selectedPaymentMethod === 'POINT' && !paymentCompleted && (
                        <div className="absolute inset-x-0 h-0.5 bg-red-300 top-1/2 -translate-y-1/2 animate-pulse" />
                      )}
                    </div>
                    <span className={`text-[7px] sm:text-[8px] font-bold mt-1 text-center tracking-tight transition-colors ${
                      kioskStep === 5 && selectedPaymentMethod === 'POINT' && !paymentCompleted
                        ? 'text-red-500 font-extrabold animate-pulse'
                        : paymentCompleted && selectedPaymentMethod === 'POINT'
                          ? 'text-sage font-black'
                          : 'text-wood-light'
                    }`}>
                      {paymentCompleted && selectedPaymentMethod === 'POINT' ? '🟢 스캔 완료' : '🔴 바코드 스캔'}
                    </span>
                  </button>

                </div>

                {/* Dynamic Hint overlay text */}
                {kioskStep === 5 && !paymentCompleted && (
                  <div className="absolute -top-12 bg-wood text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-lg animate-bounce pointer-events-none border border-uiborder">
                    {selectedPaymentMethod === 'CARD' && !cardInserted && "👇 [파란색 카드 리더기]를 터치해 카드를 꽂아주세요!"}
                    {selectedPaymentMethod === 'CASH' && "👇 [노란색 지폐 투입구]를 터치해 현금을 넣어주세요!"}
                    {selectedPaymentMethod === 'POINT' && "👇 [빨간색 바코드 스캐너]를 터치해 바코드를 스캔해 주세요!"}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}


        {/* SCREEN C: RESULTS & REPORT DASHBOARD */}
        {gameMode === 'RESULT' && currentMission && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white border-4 border-uiborder rounded-[32px] p-6 sm:p-8 text-center shadow-xl space-y-6 flex flex-col items-center"
            id="results-dashboard"
          >
            {/* Crown Header */}
            <div className="text-4xl animate-bounce-slow">🏆</div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-wood font-jua">
                도전 결과 리포트
              </h2>
              <p className="text-xs text-wood-light font-bold font-sans">
                미션 성공 조건과 내 주문 상태 비교 분석
              </p>
            </div>

            {/* Live Score Display */}
            <div className="w-full py-5 bg-mission-bg border-2 border-[#F3E5AB] rounded-2xl relative shadow-sm">
              <span className="text-[10px] text-wood font-black block uppercase tracking-wider">최종 도전 점수</span>
              <strong className="text-5xl font-black text-terracotta font-jua block tracking-tight my-1">
                {score}점
              </strong>
              
              {/* Score evaluation comment */}
              <p className="text-xs font-extrabold text-wood mt-1.5 px-4 font-sans">
                {score === 50 && "🔥 대단해요! 완벽한 키오스크 마스터입니다!"}
                {score >= 30 && score < 50 && "👍 아주 훌륭합니다! 조금만 더 신속정확하면 마스터예요!"}
                {score >= 10 && score < 30 && "✊ 분발하세요! 키오스크 주문의 기본을 닦고 있습니다."}
                {score === 0 && "😅 앗, 차근차근 튜토리얼부터 다시 천천히 연습해 볼까요?"}
              </p>

              {/* High Score Celebration Indicator */}
              {score === bestScore && score > 0 && (
                <div className="absolute -top-3.5 -right-3 bg-terracotta text-white font-black text-[10px] px-3 py-1 rounded-full shadow-md border border-terracotta/20 rotate-12 flex items-center gap-1 animate-pulse">
                  <Sparkles size={11} />
                  <span>최고 기록 경신!</span>
                </div>
              )}
            </div>

            {/* Score Breakdowns Checkpoints */}
            <div className="w-full text-left space-y-3.5 bg-cream border border-uiborder rounded-2xl p-4 sm:p-5">
              <h4 className="text-xs font-black text-wood tracking-widest pb-1.5 border-b border-uiborder/60 uppercase">
                단계별 미션 달성율
              </h4>

              <div className="space-y-2.5 text-xs">
                
                {/* Step 1 Dining Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completedSteps[0] ? (
                      <CheckCircle size={15} className="text-sage shrink-0" />
                    ) : (
                      <BadgeAlert size={15} className="text-terracotta shrink-0" />
                    )}
                    <span className="font-bold text-wood">1단계: 식사 방식 선택</span>
                  </div>
                  <span className={`font-bold font-mono ${completedSteps[0] ? 'text-sage' : 'text-terracotta'}`}>
                    {completedSteps[0] ? '+10점 (성공)' : '+0점 (실패)'}
                  </span>
                </div>

                {/* Step 2 Menu Selected */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completedSteps[1] ? (
                      <CheckCircle size={15} className="text-sage shrink-0" />
                    ) : (
                      <BadgeAlert size={15} className="text-terracotta shrink-0" />
                    )}
                    <span className="font-bold text-wood">2단계: 메뉴/옵션/수량 정확히 담기</span>
                  </div>
                  <span className={`font-bold font-mono ${completedSteps[1] ? 'text-sage' : 'text-terracotta'}`}>
                    {completedSteps[1] ? '+10점 (성공)' : '+0점 (실패)'}
                  </span>
                </div>

                {/* Step 3 Options configured */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completedSteps[2] ? (
                      <CheckCircle size={15} className="text-sage shrink-0" />
                    ) : (
                      <BadgeAlert size={15} className="text-terracotta shrink-0" />
                    )}
                    <span className="font-bold text-wood">3단계: 멤버십 적립 미션 수행</span>
                  </div>
                  <span className={`font-bold font-mono ${completedSteps[2] ? 'text-sage' : 'text-terracotta'}`}>
                    {completedSteps[2] ? '+10점 (성공)' : '+0점 (실패)'}
                  </span>
                </div>

                {/* Step 4 Cart Pay click */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completedSteps[3] ? (
                      <CheckCircle size={15} className="text-sage shrink-0" />
                    ) : (
                      <BadgeAlert size={15} className="text-terracotta shrink-0" />
                    )}
                    <span className="font-bold text-wood">4단계: 지정된 결제수단 클릭</span>
                  </div>
                  <span className={`font-bold font-mono ${completedSteps[3] ? 'text-sage' : 'text-terracotta'}`}>
                    {completedSteps[3] ? '+10점 (성공)' : '+0점 (실패)'}
                  </span>
                </div>

                {/* Step 5 Payment finished */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completedSteps[4] ? (
                      <CheckCircle size={15} className="text-sage shrink-0" />
                    ) : (
                      <BadgeAlert size={15} className="text-terracotta shrink-0" />
                    )}
                    <span className="font-bold text-wood">5단계: 결제 완료</span>
                  </div>
                  <span className={`font-bold font-mono ${completedSteps[4] ? 'text-sage' : 'text-terracotta'}`}>
                    {completedSteps[4] ? '+10점 (성공)' : '+0점 (실패)'}
                  </span>
                </div>

              </div>

              {/* Explanation note */}
              <div className="bg-white p-2.5 rounded-xl text-[10px] text-wood-light font-bold leading-normal border border-uiborder">
                💡 <strong>미션 내용 다시보기:</strong> {currentMission.description}
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={exitToHome}
                className="py-3.5 bg-cream hover:bg-cream-hover text-wood border border-uiborder rounded-2xl font-extrabold transition-all shadow-sm cursor-pointer text-sm"
              >
                🏠 메인 화면으로
              </button>

              <button
                onClick={startRealGame}
                className="py-3.5 bg-terracotta hover:bg-terracotta-hover text-white border border-terracotta/20 shadow-[0_4px_0_#B66F55] active:translate-y-0.5 active:shadow-none rounded-2xl font-extrabold transition-all cursor-pointer text-sm flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={15} />
                <span>🔄 다시 도전하기</span>
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* FOOTER */}
      <footer className="w-full max-w-xl text-center py-4 text-[10px] text-gray-400 font-semibold font-mono tracking-wide mt-4">
        KIOSK MASTER GAME © 2026 | DESIGN BY AI SENIOR DEVELOPER
      </footer>

      {/* DIALOGS AND POPUPS */}

      {/* 1. Options Selection Modal (Step 3 popup over Step 2) */}
      <OptionsModal
        isOpen={selectedOptionItem !== null}
        menuItem={selectedOptionItem}
        onClose={() => setSelectedOptionItem(null)}
        onConfirm={handleConfirmOptions}
        isTutorial={gameMode === 'TUTORIAL'}
      />

      {/* 2. Cart Mismatch Warning Dialog */}
      {showCartWarning && currentMission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFCF8] rounded-3xl overflow-hidden shadow-2xl border-4 border-terracotta max-w-sm w-full p-5 text-center animate-scale-up space-y-4">
            <div className="mx-auto w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
              <AlertTriangle size={24} />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-wood font-jua">장바구니 미정합 경고</h3>
              <p className="text-xs text-wood-light leading-normal px-2 font-bold">
                앗! 현재 장바구니에 담긴 내역이 <strong>오늘의 미션과 다릅니다.</strong><br />
                이대로 결제를 진행하면 4단계 점수를 획득할 수 없으며 최종 결과 점수가 깎이게 됩니다!
              </p>
            </div>

            {/* Mission review box */}
            <div className="bg-cream border border-uiborder text-wood rounded-xl p-3 text-left text-[11px] font-sans font-bold">
              🎯 오늘의 미션:<br />
              <p className="text-wood-light font-semibold mt-1">
                {currentMission.description}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  setShowCartWarning(false);
                }}
                className="flex-1 py-3 bg-cream hover:bg-cream-hover text-wood border border-uiborder font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                🙋‍♀️ 뒤로가서 고치기
              </button>
              
              <button
                onClick={handleForcePay}
                className="flex-1 py-3 bg-terracotta hover:bg-terracotta-hover text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                💸 그냥 결제할래요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tutorial Success Celeb Dialog */}
      {showTutorialSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFCF8] rounded-3xl overflow-hidden shadow-2xl border-4 border-sage max-w-sm w-full p-6 text-center animate-scale-up space-y-5">
            <div className="text-5xl animate-bounce-slow">🎉</div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-wood font-jua">
                튜토리얼 완료!
              </h3>
              <p className="text-sm text-wood-light leading-normal font-bold font-sans">
                축하합니다! 오늘의 미션을 정확히 끝마치셨어요.<br />
                이제 키오스크 주문의 기본을 완벽히 마스터하셨습니다!
              </p>
            </div>

            <p className="text-xs bg-cream border border-uiborder text-wood-light p-3 rounded-xl font-bold leading-relaxed font-sans">
              "실전 게임 모드"에서는 물음표 도움말 도움 없이 1단계부터 5단계까지 완벽하게 주문을 완수하고 50점 만점과 함께 베스트 기록에 도전할 수 있습니다!
            </p>

            <div className="pt-1">
              <button
                onClick={() => {
                  playSound('click');
                  setShowTutorialSuccess(false);
                  setGameMode('HOME');
                }}
                className="w-full py-4 bg-sage hover:bg-sage/95 text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer border border-sage/20 shadow-[0_4px_0_#6A8471] active:translate-y-0.5 active:shadow-none"
              >
                🏠 메인 화면으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Difficulty Selection Popup (EASY / HARD) */}
      {showDifficultyPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFCF8] rounded-3xl overflow-hidden shadow-2xl border-4 border-wood max-w-sm w-full p-6 text-center animate-scale-up space-y-4">
            <div className="mx-auto w-12 h-12 bg-cream rounded-full flex items-center justify-center text-2xl border border-uiborder">
              🎮
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-wood font-jua">본게임 난이도 선택</h3>
              <p className="text-xs text-wood-light leading-normal px-2 font-bold font-sans">
                원하는 난이도를 선택하여 도전을 시작하세요!
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setShowDifficultyPopup(false);
                  startRealGame('EASY');
                }}
                className="w-full p-4 bg-white hover:bg-green-50 text-wood border-3 border-green-500 rounded-2xl flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☘️</span>
                  <div className="text-left">
                    <div className="text-sm font-black text-wood font-jua">이지 모드 (Easy)</div>
                    <div className="text-[10px] text-wood-light font-semibold">랜덤 메뉴 1개 주문 (수량 1개 고정)</div>
                  </div>
                </div>
                <span className="text-[10px] bg-green-100 text-green-700 font-extrabold px-2 py-0.5 rounded-md uppercase">선택</span>
              </button>

              <button
                onClick={() => {
                  setShowDifficultyPopup(false);
                  startRealGame('HARD');
                }}
                className="w-full p-4 bg-white hover:bg-red-50 text-wood border-3 border-red-500 rounded-2xl flex items-center justify-between transition-all hover:scale-101 active:scale-99 cursor-pointer shadow-sm group animate-pulse-slow"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div className="text-left">
                    <div className="text-sm font-black text-wood font-jua">하드 모드 (Hard)</div>
                    <div className="text-[10px] text-wood-light font-semibold">여러 메뉴 + 복잡한 옵션 조합 주문</div>
                  </div>
                </div>
                <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 rounded-md uppercase">도전</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  playSound('click');
                  setShowDifficultyPopup(false);
                }}
                className="w-full py-2.5 bg-cream hover:bg-cream-hover text-wood-light font-bold rounded-xl text-xs transition-colors cursor-pointer border border-uiborder/60"
              >
                취소 (Go back)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Membership Accumulation Step Popup (Step 2 -> Step 3) */}
      {showMembershipPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFCF8] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#856404] max-w-sm w-full p-6 text-center animate-scale-up space-y-4">
            
            {!showKeypad ? (
              <>
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl border border-amber-300">
                  📱
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-wood font-jua">멤버십 포인트 적립</h3>
                  <p className="text-xs text-wood-light leading-normal px-2 font-bold font-sans">
                    주문 결제 전에 멤버십 포인트를 적립하시겠습니까?
                  </p>
                </div>

                {/* Mission reminder */}
                <div className="bg-mission-bg border border-[#F3E5AB] p-2.5 rounded-xl text-left text-[11px] font-sans font-bold">
                  {gameMode === 'PRACTICE' ? (
                    <>
                      💡 자유 연습 안내: <br />
                      <span className="text-blue-700 font-semibold">
                        자유 연습 모드입니다. 휴대폰 번호로 직접 적립을 해보거나 아래 [적립 안함]을 눌러 생략해 보세요!
                      </span>
                    </>
                  ) : (
                    <>
                      🎯 미션 힌트: <br />
                      <span className="text-[#856404] font-semibold">
                        이 미션은 멤버십 적립을 <strong className="underline decoration-2 underline-offset-1 text-terracotta">{currentMission?.membershipAccumulate ? '해야 합니다' : '안 해야 합니다'}</strong>.
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      playSound('click');
                      setShowKeypad(true);
                    }}
                    className="w-full py-3 bg-wood hover:bg-wood/90 text-white font-extrabold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📞 휴대폰 번호 입력하여 적립</span>
                  </button>
                  
                  <button
                    onClick={() => handleMembershipChoice(false)}
                    className="w-full py-3 bg-cream hover:bg-cream-hover text-wood border border-uiborder font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    🙅‍♂️ 적립 안함 (취소)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-wood font-jua">멤버십 적립 번호 입력</h3>
                  <p className="text-[10px] text-wood-light font-semibold font-sans">
                    휴대폰 번호를 정확하게 터치해 주세요.
                  </p>
                </div>

                {/* Phone number display */}
                <div className="bg-white border-3 border-uiborder rounded-xl p-3 text-center text-xl font-black text-wood font-mono tracking-wider shadow-inner">
                  {formatPhoneNumber(membershipPhone)}
                </div>

                {/* Keypad Grid (3x4) */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="py-3 bg-cream hover:bg-cream-hover text-wood font-extrabold rounded-lg text-sm border border-uiborder cursor-pointer transition-colors active:bg-uiborder/40"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="py-3 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold rounded-lg text-[11px] border border-red-200 cursor-pointer transition-colors"
                  >
                    지우기
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="py-3 bg-cream hover:bg-cream-hover text-wood font-extrabold rounded-lg text-sm border border-uiborder cursor-pointer transition-colors active:bg-uiborder/40"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setShowKeypad(false);
                    }}
                    className="py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-extrabold rounded-lg text-[11px] border border-gray-200 cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                </div>

                {/* Complete Confirm button */}
                <button
                  type="button"
                  onClick={() => handleMembershipChoice(true)}
                  disabled={membershipPhone.length < 10}
                  className={`w-full py-3.5 font-extrabold rounded-xl text-xs transition-all shadow-sm ${
                    membershipPhone.length < 10
                      ? 'bg-uiborder text-wood/30 cursor-not-allowed'
                      : 'bg-[#4A90E2] hover:bg-[#357ABD] text-white cursor-pointer border border-[#4A90E2]/20'
                  }`}
                >
                  ✨ 적립 완료 (Confirm)
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* 6. Tutorial Failure Dialog */}
      {showTutorialFailure && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FDFCF8] rounded-3xl overflow-hidden shadow-2xl border-4 border-terracotta max-w-sm w-full p-6 text-center animate-scale-up space-y-5">
            <div className="mx-auto w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-wood font-jua">
                미션 불일치! (Mission Failed)
              </h3>
              <p className="text-sm text-wood-light leading-normal font-bold font-sans">
                앗! 튜토리얼을 완료했으나, 장바구니 품목이나 수량이 미션 요구 사항과 일치하지 않았습니다.
              </p>
            </div>

            {/* Mission review box */}
            <div className="bg-cream border border-uiborder text-wood rounded-xl p-3 text-left text-[11px] font-sans font-bold">
              🎯 원래 수행하려던 미션:<br />
              <p className="text-wood-light font-semibold mt-1">
                {currentMission?.description}
              </p>
            </div>

            <p className="text-xs text-wood-light font-semibold leading-relaxed font-sans">
              장바구니에 담을 때 음료 온도(ICE/HOT), 샷 추가, 시럽 추가 등 미세한 세부 옵션과 음료 수량이 정확했는지 다시 한번 찬찬히 확인해 보세요!
            </p>

            <div className="pt-1">
              <button
                onClick={() => {
                  playSound('click');
                  setShowTutorialFailure(false);
                  setGameMode('HOME');
                }}
                className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white font-extrabold rounded-2xl shadow-md transition-all cursor-pointer border border-terracotta/20 shadow-[0_4px_0_#B66F55] active:translate-y-0.5 active:shadow-none"
              >
                🏠 메인 화면으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
