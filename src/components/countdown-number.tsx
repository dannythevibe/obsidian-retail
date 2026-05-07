"use client";

import { useEffect, useRef, useState } from "react";

const CYCLE = 320; // ms per digit

export function CountdownNumber() {
  const [display, setDisplay] = useState(60);
  const counter = useRef(60);

  useEffect(() => {
    // Change the displayed number at the midpoint of each cycle —
    // precisely when the element is invisible between slide-out and slide-in.
    const interval = setInterval(() => {
      setTimeout(() => {
        counter.current = counter.current <= 11 ? 60 : counter.current - 1;
        setDisplay(counter.current);
      }, CYCLE * 0.4); // swap at 40% — dead centre of the invisible window
    }, CYCLE);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="inline-block overflow-hidden"
      style={{ verticalAlign: "baseline", lineHeight: 1 }}
    >
      <span
        className="inline-block"
        style={{ animation: `digitRoll ${CYCLE}ms cubic-bezier(0.4, 0, 0.2, 1) infinite` }}
      >
        {display}
      </span>

      <style>{`
        @keyframes digitRoll {
          0%   { transform: translateY(0%);    opacity: 1; }
          30%  { transform: translateY(-55%);  opacity: 0; }
          31%  { transform: translateY(55%);   opacity: 0; }
          70%  { transform: translateY(55%);   opacity: 0; }
          100% { transform: translateY(0%);    opacity: 1; }
        }
      `}</style>
    </span>
  );
}
