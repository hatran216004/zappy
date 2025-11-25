import { useEffect, useState } from 'react';

// Fire Effect Component
export function FireEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Multiple fire particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="fire-particle absolute"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-10%',
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random() * 0.5}s`
          }}
        >
          🔥
        </div>
      ))}
      <style>{`
        @keyframes fire-rise {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-50vh) scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }
        
        .fire-particle {
          font-size: 2rem;
          animation: fire-rise linear forwards;
        }
      `}</style>
    </div>
  );
}

// Clap Effect Component
export function ClapEffect() {
  const [claps, setClaps] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    // Generate clap positions
    const newClaps = [...Array(12)].map((_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // 20-80% horizontal
      y: 20 + Math.random() * 60  // 20-80% vertical
    }));
    setClaps(newClaps);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {claps.map((clap) => (
        <div
          key={clap.id}
          className="clap-particle absolute"
          style={{
            left: `${clap.x}%`,
            top: `${clap.y}%`,
            animationDelay: `${clap.id * 0.08}s`
          }}
        >
          👏
        </div>
      ))}
      <style>{`
        @keyframes clap-appear {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 0;
          }
        }
        
        .clap-particle {
          font-size: 3rem;
          animation: clap-appear 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Shake Effect for Message Bubble
export function useShakeEffect(trigger: boolean) {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return isShaking;
}

// Effect Manager Component
interface MessageEffectManagerProps {
  effect: string | null;
  onComplete?: () => void;
}

export function MessageEffectManager({ effect, onComplete }: MessageEffectManagerProps) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (effect) {
      setShowEffect(true);
      const timer = setTimeout(() => {
        setShowEffect(false);
        onComplete?.();
      }, 1500); // Effect duration

      return () => clearTimeout(timer);
    }
  }, [effect, onComplete]);

  if (!showEffect || !effect) return null;

  switch (effect) {
    case 'fire':
      return <FireEffect />;
    case 'clap':
      return <ClapEffect />;
    default:
      return null;
  }
}

