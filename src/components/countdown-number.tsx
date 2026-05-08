"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CountdownNumber() {
  const [display, setDisplay] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 2000); // 2 seconds per digit for a calm, premium feel

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex flex-col items-center justify-center min-w-[1.5ch] h-[1em] overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={display}
          initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 20, 
            mass: 0.5,
            duration: 0.8 
          }}
          className="inline-block"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
