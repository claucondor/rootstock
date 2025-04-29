import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const AnimatedCard = ({
  children,
  className = '',
  delay = 0,
  onClick,
  hoverEffect = true,
}: AnimatedCardProps) => {
  return (
    <motion.div
      className={`rounded-lg bg-gray-900 border border-gray-800 ${className} ${
        hoverEffect ? 'hover:border-blue-500/50 transition-colors' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      whileHover={hoverEffect ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
