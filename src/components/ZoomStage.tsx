'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

interface ZoomStageProps {
  children: ReactNode;
  /** Bump this number to animate the view back to its initial transform. */
  resetSignal: number;
  className?: string;
}

/** A pan/zoom/pinch viewport that fills its parent and centers its content. */
export function ZoomStage({ children, resetSignal, className = '' }: ZoomStageProps) {
  const ref = useRef<ReactZoomPanPinchRef | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    ref.current?.resetTransform(160);
  }, [resetSignal]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-surface-2 ${className}`}>
      <TransformWrapper
        ref={ref}
        initialScale={1}
        minScale={0.5}
        maxScale={16}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ step: 0.7 }}
        wheel={{ step: 0.12 }}
      >
        <TransformComponent
          wrapperClass="rzpp-fill"
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
