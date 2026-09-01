"use client";
import { useRef } from "react";

const SWIPE_THRESHOLD = 60;
const SWIPE_RESTRAINT = 75;

/** 左から右へのスワイプ(スマホの「戻る」ジェスチャー)を検知して onSwipeBack を呼ぶ */
export function useSwipeBack(onSwipeBack: () => void) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (dx > SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_RESTRAINT) {
      onSwipeBack();
    }
  };

  return { onTouchStart, onTouchEnd };
}
