import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const textSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Chat bubble background */}
          <motion.path
            d="M8 16C8 11.5817 11.5817 8 16 8H48C52.4183 8 56 11.5817 56 16V40C56 44.4183 52.4183 48 48 48H24L12 56V48H16C11.5817 48 8 44.4183 8 40V16Z"
            fill="url(#gradient)"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          />
          {/* Letter D */}
          <text
            x="24"
            y="38"
            fontSize="24"
            fontWeight="bold"
            fill="white"
            fontFamily="Ubuntu, sans-serif"
          >
            D
          </text>
          <defs>
            <linearGradient
              id="gradient"
              x1="8"
              y1="8"
              x2="56"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span
          className={`font-ubuntu font-bold text-brand-600 ${textSizes[size]}`}
        >
          DostChats
        </span>
      )}
    </motion.div>
  );
};

export default Logo;
