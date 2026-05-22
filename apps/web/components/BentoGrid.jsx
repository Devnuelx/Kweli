"use client";

import { motion } from "framer-motion";

export const BentoGrid = ({ children, className }) => {
  return (
    <div
      className={`grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ${className}`}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  suffix,
  value,
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`row-span-1 rounded-3xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-6 dark:bg-[#111317] dark:border-white/[0.1] bg-white border border-transparent justify-between flex flex-col space-y-4 ${className}`}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          {value && (
            <span className="text-2xl font-bold font-funnel-display text-white">
              {value}
              {suffix && <span className="text-blue-400 ml-1">{suffix}</span>}
            </span>
          )}
        </div>
        <div className="font-bold text-white mb-1 mt-2 text-xl font-funnel-display">
          {title}
        </div>
        <div className="font-normal text-gray-400 text-sm">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
