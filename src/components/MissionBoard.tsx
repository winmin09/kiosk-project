import React from 'react';
import { Mission, GameMode } from '../types';
import { Sparkles, Trophy, CheckCircle, Circle } from 'lucide-react';

interface MissionBoardProps {
  mission: Mission;
  mode: GameMode;
  score: number;
  completedSteps: boolean[];
}

export default function MissionBoard({ mission, mode, score, completedSteps }: MissionBoardProps) {
  const { diningType, menuItem, temperature, options } = mission || {};

  // Render steps status: 매장 선택 -> 메뉴/옵션/수량 정확히 담기 -> 적립 미션 수행 -> 지정된 결제수단 클릭 -> 결제 완료
  const stepLabels = ['매장선택', '장바구니', '멤버십적립', '결제수단', '결제완료'];

  return (
    <div className="bg-cream/90 backdrop-blur-md border-b-2 border-uiborder p-4 sticky top-0 z-40 shadow-sm rounded-b-2xl">
      <div className="max-w-xl mx-auto">
        {/* Header line: Title & mode badge & Live score if in GAME mode */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              mode === 'TUTORIAL' 
                ? 'bg-sage/10 text-sage border border-sage/30' 
                : mode === 'PRACTICE'
                  ? 'bg-blue-100 text-[#4A90E2] border border-blue-300'
                  : 'bg-terracotta/10 text-terracotta border border-terracotta/30 animate-pulse'
            }`}>
              {mode === 'TUTORIAL' ? '💡 튜토리얼 모드' : mode === 'PRACTICE' ? '✨ 자유 연습 모드' : '🎮 실전 게임 모드'}
            </span>
            {mode !== 'PRACTICE' && mission?.difficulty === 'HARD' && (
              <span className="px-2 py-0.5 bg-red-100 border border-red-300 text-red-700 text-[10px] font-extrabold rounded-md uppercase tracking-wide animate-pulse">
                🔥 하드 모드
              </span>
            )}
            {mode !== 'PRACTICE' && mission?.difficulty === 'EASY' && (
              <span className="px-2 py-0.5 bg-green-100 border border-green-300 text-green-700 text-[10px] font-extrabold rounded-md uppercase tracking-wide">
                ☘️ 이지 모드
              </span>
            )}
          </div>

          {mode === 'GAME' && (
            <div className="flex items-center gap-1.5 bg-wood text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              <Trophy size={14} className="text-terracotta animate-bounce-slow" />
              <span>실시간 점수: <strong className="text-white text-sm">{score}</strong> / 50점</span>
            </div>
          )}
        </div>

        {/* Mission Content Box - styled as Natural Tones mission board */}
        <div className="bg-mission-bg border-3 border-[#F3E5AB] rounded-2xl p-4 shadow-[0_4px_0_#EAD793]">
          <div className="flex items-start gap-2.5">
            <span className="text-xl shrink-0 mt-0.5">🎯</span>
            <div className="flex-1">
              <h4 className="text-[10px] font-black text-[#856404] tracking-wider uppercase mb-1">
                {mode === 'PRACTICE' ? '자유 연습 안내' : '오늘의 미션 (Mission Goal)'}
              </h4>
              <p className="text-[#856404] text-xs sm:text-sm font-bold leading-relaxed font-sans whitespace-pre-line">
                {mode === 'PRACTICE' 
                  ? '💡 원하는 메뉴를 마음껏 담고 결제 과정을 연습해보세요!' 
                  : mission?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Step Checkpoints */}
        <div className="mt-4 pt-2.5 border-t border-uiborder flex items-center justify-between">
          <div className="text-[10px] font-bold text-wood/60 uppercase tracking-wider">주문 진행도</div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {stepLabels.map((label, idx) => {
              const isDone = completedSteps[idx];
              return (
                <div key={idx} className="flex items-center gap-0.5 sm:gap-1">
                  {isDone ? (
                    <CheckCircle size={14} className="text-sage fill-sage/10" />
                  ) : (
                    <Circle size={14} className="text-uiborder" />
                  )}
                  <span className={`text-[10px] font-semibold sm:inline hidden ${isDone ? 'text-sage font-bold' : 'text-wood/40'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
