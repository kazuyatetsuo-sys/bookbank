"use client";
import { useRef } from "react";

const SWIPE_THRESHOLD = 45;
const SWIPE_RATIO = 1.5; // 横方向の移動量は縦方向の何倍以上必要か

/** 左から右へのスワイプ(スマホの「戻る」ジェスチャー)を検知して onSwipeBack を呼ぶ */
export function useSwipeBack(onSwipeBack: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      tracking.current = false;
      return;
    }
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    tracking.current = true;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!tracking.current) return;
    tracking.current = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (dx > SWIPE_THRESHOLD && dx > Math.abs(dy) * SWIPE_RATIO) {
      onSwipeBack();
    }
  };

  const onTouchCancel = () => {
    tracking.current = false;
  };

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
