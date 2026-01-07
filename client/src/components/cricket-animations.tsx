import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Zap, AlertTriangle, Circle, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

type CricketEventType = "wicket" | "six" | "four" | "no-ball" | "wide" | "dot" | "single" | "double" | "triple" | null;

interface CricketAnimationProps {
  event: CricketEventType;
  onComplete?: () => void;
}

const eventConfig = {
  wicket: {
    icon: X,
    text: "WICKET!",
    bgColor: "from-red-600 via-red-500 to-red-700",
    textColor: "text-white",
    glowColor: "shadow-[0_0_100px_rgba(239,68,68,0.8)]",
    duration: 3000,
  },
  six: {
    icon: Flame,
    text: "MAXIMUM SIX!",
    bgColor: "from-yellow-500 via-amber-400 to-orange-500",
    textColor: "text-black",
    glowColor: "shadow-[0_0_100px_rgba(251,191,36,0.8)]",
    duration: 3000,
  },
  four: {
    icon: Zap,
    text: "BOUNDARY!",
    bgColor: "from-emerald-500 via-green-400 to-teal-500",
    textColor: "text-white",
    glowColor: "shadow-[0_0_100px_rgba(16,185,129,0.8)]",
    duration: 2500,
  },
  "no-ball": {
    icon: AlertTriangle,
    text: "NO BALL",
    bgColor: "from-red-500 via-rose-500 to-pink-600",
    textColor: "text-white",
    glowColor: "shadow-[0_0_60px_rgba(239,68,68,0.6)]",
    duration: 2000,
  },
  wide: {
    icon: Circle,
    text: "WIDE",
    bgColor: "from-blue-500 via-cyan-500 to-blue-600",
    textColor: "text-white",
    glowColor: "shadow-[0_0_60px_rgba(59,130,246,0.6)]",
    duration: 2000,
  },
  dot: {
    icon: Target,
    text: "DOT",
    bgColor: "from-gray-600 via-gray-500 to-gray-700",
    textColor: "text-white",
    glowColor: "",
    duration: 1000,
  },
  single: {
    icon: null,
    text: "1",
    bgColor: "from-purple-500 via-violet-500 to-purple-600",
    textColor: "text-white",
    glowColor: "",
    duration: 1000,
  },
  double: {
    icon: null,
    text: "2",
    bgColor: "from-purple-500 via-violet-500 to-purple-600",
    textColor: "text-white",
    glowColor: "",
    duration: 1000,
  },
  triple: {
    icon: null,
    text: "3",
    bgColor: "from-purple-500 via-violet-500 to-purple-600",
    textColor: "text-white",
    glowColor: "",
    duration: 1500,
  },
};

function triggerCelebration(type: CricketEventType) {
  if (type === "six") {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const colors = ["#ffd60a", "#ff6b35", "#f59e0b"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  } else if (type === "wicket") {
    confetti({
      particleCount: 100,
      startVelocity: 30,
      spread: 360,
      origin: { y: 0.5 },
      colors: ["#ef4444", "#dc2626", "#b91c1c"],
    });
  } else if (type === "four") {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#059669", "#047857"],
    });
  }
}

export function CricketEventAnimation({ event, onComplete }: CricketAnimationProps) {
  useEffect(() => {
    if (event && eventConfig[event]) {
      triggerCelebration(event);
      const timer = setTimeout(() => {
        onComplete?.();
      }, eventConfig[event].duration);
      return () => clearTimeout(timer);
    }
  }, [event, onComplete]);

  if (!event || !eventConfig[event]) return null;

  const config = eventConfig[event];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`relative bg-gradient-to-r ${config.bgColor} rounded-3xl p-12 ${config.glowColor}`}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {Icon && (
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: event === "wicket" ? [0, 10, -10, 0] : 0
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="flex justify-center mb-4"
              >
                <Icon className={`w-20 h-20 ${config.textColor}`} />
              </motion.div>
            )}
            <motion.h1
              initial={{ scale: 0.5 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className={`font-display text-6xl md:text-8xl ${config.textColor} tracking-wider`}
            >
              {config.text}
            </motion.h1>
          </motion.div>

          {(event === "six" || event === "wicket" || event === "four") && (
            <>
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(255,255,255,0.4)",
                    "0 0 0 30px rgba(255,255,255,0)",
                  ],
                }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full bg-white/80"
                  initial={{ 
                    x: 0, 
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 8) * 200,
                    y: Math.sin((i * Math.PI * 2) / 8) * 200,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: -8,
                    marginTop: -8,
                  }}
                />
              ))}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface RunDisplayProps {
  runs: number;
  isAnimating: boolean;
}

export function RunDisplay({ runs, isAnimating }: RunDisplayProps) {
  const getRunColor = () => {
    if (runs === 6) return "text-yellow-400 text-glow-gold";
    if (runs === 4) return "text-emerald-400 text-glow-orange";
    if (runs === 0) return "text-gray-400";
    return "text-purple-400";
  };

  return (
    <motion.div
      key={runs}
      initial={isAnimating ? { scale: 2, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`font-display text-9xl ${getRunColor()}`}
    >
      {runs}
    </motion.div>
  );
}

export function BallIndicator({ 
  type, 
  runs 
}: { 
  type: "normal" | "wicket" | "wide" | "no-ball" | "boundary" | "six"; 
  runs: number;
}) {
  const getStyle = () => {
    switch (type) {
      case "wicket":
        return "bg-red-500 text-white";
      case "wide":
        return "bg-blue-500 text-white";
      case "no-ball":
        return "bg-rose-500 text-white";
      case "six":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-black animate-pulse";
      case "boundary":
        return "bg-gradient-to-r from-emerald-400 to-green-500 text-white";
      default:
        return runs === 0 ? "bg-gray-500 text-white" : "bg-purple-500 text-white";
    }
  };

  const getText = () => {
    if (type === "wicket") return "W";
    if (type === "wide") return "Wd";
    if (type === "no-ball") return "Nb";
    return runs.toString();
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg ${getStyle()}`}
    >
      {getText()}
    </motion.div>
  );
}
