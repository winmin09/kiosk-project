import React, { useState, useEffect } from 'react';
import { MenuItem, SelectedOptions } from '../types';
import { OPTION_PRICES } from '../data';
import KioskTooltip from './KioskTooltip';
import { X, Check } from 'lucide-react';
import { playSound } from '../utils/audio';

interface OptionsModalProps {
  isOpen: boolean;
  menuItem: MenuItem | null;
  onClose: () => void;
  onConfirm: (temperature: 'ICE' | 'HOT' | null, options: SelectedOptions) => void;
  isTutorial: boolean;
}

export default function OptionsModal({
  isOpen,
  menuItem,
  onClose,
  onConfirm,
  isTutorial,
}: OptionsModalProps) {
  const [temperature, setTemperature] = useState<'ICE' | 'HOT' | null>(null);
  const [options, setOptions] = useState<SelectedOptions>({ shot: false, syrup: false });

  // Reset states when modal opens for a new menu item
  useEffect(() => {
    if (menuItem) {
      // Set default temperature if available
      if (menuItem.allowedTemperatures.includes('ICE') && menuItem.allowedTemperatures.includes('HOT')) {
        setTemperature('ICE'); // Default to ICE for dual temperature drinks
      } else if (menuItem.allowedTemperatures.length === 1) {
        setTemperature(menuItem.allowedTemperatures[0]);
      } else {
        setTemperature(null);
      }

      setOptions({ shot: false, syrup: false });
    }
  }, [menuItem]);

  if (!isOpen || !menuItem) return null;

  const handleTempChange = (temp: 'ICE' | 'HOT') => {
    playSound('click');
    setTemperature(temp);
  };

  const handleOptionToggle = (opt: 'shot' | 'syrup') => {
    playSound('click');
    setOptions((prev) => ({
      ...prev,
      [opt]: !prev[opt],
    }));
  };

  // Real-time calculated price
  const extraPrice =
    (options.shot ? OPTION_PRICES.shot : 0) +
    (options.syrup ? OPTION_PRICES.syrup : 0);
  const totalPrice = menuItem.price + extraPrice;

  const handleSubmit = () => {
    onConfirm(temperature, options);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border-4 border-uiborder max-w-sm w-full animate-scale-up">
        {/* Header */}
        <div className="bg-cream p-5 flex items-center justify-between border-b-2 border-uiborder">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{menuItem.emoji}</span>
            <h3 className="text-lg font-black text-wood font-jua">{menuItem.name} 옵션 선택</h3>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="text-wood/60 hover:text-wood bg-white p-1 rounded-full border border-uiborder cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 1. Temperature selection (Required) */}
          {menuItem.allowedTemperatures.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-wood border-l-4 border-sage pl-2.5 flex items-center gap-1">
                  <span className="text-terracotta font-bold">*</span> 컵 온도 선택 (필수)
                </label>
                {isTutorial && (
                  <KioskTooltip 
                    text="음료를 차갑게(아이스) 마실지, 따뜻하게(핫) 마실지 필수 선택하는 영역이에요." 
                    position="left" 
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {menuItem.allowedTemperatures.includes('ICE') && (
                  <button
                    type="button"
                    onClick={() => handleTempChange('ICE')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold transition-all cursor-pointer ${
                      temperature === 'ICE'
                        ? 'bg-sage border-sage text-white shadow-md scale-102'
                        : 'bg-white border-uiborder text-wood/60 hover:bg-cream'
                    }`}
                  >
                    <span className="text-lg">🧊</span> 아이스 (+0원)
                    {temperature === 'ICE' && <Check size={16} className="text-white stroke-[3]" />}
                  </button>
                )}
                {menuItem.allowedTemperatures.includes('HOT') && (
                  <button
                    type="button"
                    onClick={() => handleTempChange('HOT')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold transition-all cursor-pointer ${
                      temperature === 'HOT'
                        ? 'bg-sage border-sage text-white shadow-md scale-102'
                        : 'bg-white border-uiborder text-wood/60 hover:bg-cream'
                    }`}
                  >
                    <span className="text-lg">🔥</span> 핫 (+0원)
                    {temperature === 'HOT' && <Check size={16} className="text-white stroke-[3]" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. Extra Options selection (Optional) */}
          {menuItem.allowedOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-wood border-l-4 border-sage pl-2.5">추가 옵션 선택 (선택)</label>
                {isTutorial && (
                  <KioskTooltip 
                    text="샷 추가(커피 진하게)나 시럽 추가(달콤하게) 등 내 입맛에 맞게 조절하는 추가 옵션이에요." 
                    position="left" 
                  />
                )}
              </div>

              <div className="space-y-2">
                {menuItem.allowedOptions.includes('shot') && (
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      options.shot
                        ? 'bg-sage/10 border-sage text-wood font-bold'
                        : 'bg-white border-uiborder text-wood-light hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={options.shot}
                        onChange={() => handleOptionToggle('shot')}
                        className="w-5 h-5 rounded accent-sage cursor-pointer"
                      />
                      <span className="text-sm font-medium">☕ 샷 추가</span>
                    </div>
                    <span className="text-xs font-bold text-white bg-terracotta px-2.5 py-0.5 rounded-full">
                      +500원
                    </span>
                  </label>
                )}

                {menuItem.allowedOptions.includes('syrup') && (
                  <label
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      options.syrup
                        ? 'bg-sage/10 border-sage text-wood font-bold'
                        : 'bg-white border-uiborder text-wood-light hover:bg-cream'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={options.syrup}
                        onChange={() => handleOptionToggle('syrup')}
                        className="w-5 h-5 rounded accent-sage cursor-pointer"
                      />
                      <span className="text-sm font-medium">🍯 시럽 추가</span>
                    </div>
                    <span className="text-xs font-bold text-white bg-terracotta px-2.5 py-0.5 rounded-full">
                      +300원
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="bg-cream rounded-2xl p-3 border border-uiborder flex items-center justify-between text-sm">
            <span className="text-wood/60 font-medium">기본 금액: {menuItem.price.toLocaleString()}원</span>
            {extraPrice > 0 && (
              <span className="text-terracotta font-black">옵션 추가: +{extraPrice.toLocaleString()}원</span>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="bg-cream p-5 border-t border-uiborder flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="flex-1 py-3.5 bg-white border-2 border-uiborder text-wood rounded-2xl font-bold hover:bg-cream transition-colors cursor-pointer text-sm"
          >
            취소
          </button>
          
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => {
                playSound('success');
                handleSubmit();
              }}
              className="w-full py-3.5 bg-sage hover:bg-sage-hover text-white rounded-2xl font-bold transition-all shadow-md active:scale-98 cursor-pointer text-sm flex items-center justify-center gap-1.5 border border-sage/20"
            >
              장바구니 담기 ({totalPrice.toLocaleString()}원)
            </button>
            {isTutorial && (
              <div className="absolute -top-3 -right-3">
                <KioskTooltip 
                  text="선택한 옵션과 수량을 확인하고 장바구니에 담는 버튼이에요!" 
                  position="top" 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
