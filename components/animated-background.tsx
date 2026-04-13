"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-800 via-green-600 to-green-700" />
      
      {/* Animated wave layers */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-64 opacity-30"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(34,197,94,0.4) 100%)",
          borderRadius: "100% 100% 0 0",
        }}
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-48 opacity-20"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(22,163,74,0.5) 100%)",
          borderRadius: "100% 100% 0 0",
        }}
        animate={{
          y: [0, -30, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-25"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(21,128,61,0.6) 100%)",
          borderRadius: "100% 100% 0 0",
        }}
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      
      {/* Grass texture overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='https://static.vecteezy.com/system/resources/thumbnails/009/660/761/small/grass-seamless-pattern-texture-green-grass-waves-for-wallpaper-ui-game-vector.jpg d='M0,100 Q25,90 25,70 Q25,50 20,30 Q15,10 10,0 L15,0 Q20,15 25,35 Q30,55 30,75 Q30,95 5,100 Z' fill='%23166534'/%3E%3C/svg%3E")`,
        backgroundSize: "50px 100px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "bottom",
      }} />
    </div>
  );
}
