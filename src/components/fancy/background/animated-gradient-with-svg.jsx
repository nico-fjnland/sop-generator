import React, { useMemo, useRef, useState } from "react"

import { cn } from "../../../lib/utils"
import { useDimensions } from "../../../hooks/use-debounced-dimensions"

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const AnimatedGradient = ({
  colors,
  speed = 5,
  blur = "light",
}) => {
  const containerRef = useRef(null)
  const dimensions = useDimensions(containerRef)
  
  // Store random values in state so they persist across re-renders
  // This prevents SVGs from being recreated with new random positions on each render
  const [circleConfigs] = useState(() => 
    colors.map(() => ({
      sizeFactor: randomInt(0.5, 1.5),
      top: Math.random() * 50,
      left: Math.random() * 50,
      tx1: Math.random() - 0.5,
      ty1: Math.random() - 0.5,
      tx2: Math.random() - 0.5,
      ty2: Math.random() - 0.5,
      tx3: Math.random() - 0.5,
      ty3: Math.random() - 0.5,
      tx4: Math.random() - 0.5,
      ty4: Math.random() - 0.5,
    }))
  );

  // Use measured dimensions, but fallback to window dimensions if not yet measured
  // This prevents the SVGs from being invisible (0x0) during initial render
  const circleSize = useMemo(() => {
    const measured = Math.max(dimensions.width, dimensions.height);
    if (measured > 0) return measured;
    // Fallback to window dimensions if not yet measured
    if (typeof window !== 'undefined') {
      return Math.max(window.innerWidth, window.innerHeight);
    }
    return 1000; // Ultimate fallback
  }, [dimensions.width, dimensions.height]);

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
        ? "blur-3xl"
        : "blur-[100px]"

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div className={cn(`absolute inset-0`, blurClass)}>
        {colors.map((color, index) => {
          const config = circleConfigs[index] || circleConfigs[0];
          const animationProps = {
            animation: `background-gradient ${speed}s infinite ease-in-out`,
            animationDuration: `${speed}s`,
            top: `${config.top}%`,
            left: `${config.left}%`,
            "--tx-1": config.tx1,
            "--ty-1": config.ty1,
            "--tx-2": config.tx2,
            "--ty-2": config.ty2,
            "--tx-3": config.tx3,
            "--ty-3": config.ty3,
            "--tx-4": config.tx4,
            "--ty-4": config.ty4,
          }

          return (
            <svg
              key={index}
              className={cn("absolute", "animate-background-gradient")}
              width={circleSize * config.sizeFactor}
              height={circleSize * config.sizeFactor}
              viewBox="0 0 100 100"
              style={animationProps}>
              <circle cx="50" cy="50" r="50" fill={color} />
            </svg>
          );
        })}
      </div>
    </div>
  );
}

export default AnimatedGradient
