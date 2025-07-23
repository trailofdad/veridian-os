"use client";

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text } from '@tremor/react';
import { RiCloseLine } from '@remixicon/react';

interface Windows95WindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  isLoading?: boolean;
  loadingText?: string;
  loadingIcon?: React.ComponentType<{ className?: string }>;
}

export const Windows95Window: React.FC<Windows95WindowProps> = ({
  isOpen,
  onClose,
  title,
  titleIcon: TitleIcon,
  children,
  className = "",
  contentClassName = "",
  isLoading = false,
  loadingText = "Loading...",
  loadingIcon: LoadingIcon,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Window Container */}
          <div 
            className="fixed inset-0 bg-transparent z-50 flex justify-center items-center px-4" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Window */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`w-full max-w-3xl ${className}`}
            >
              {/* Window Frame */}
              <div className="win95-window-frame shadow-2xl">
                {/* Title Bar */}
                <div className="win95-titlebar px-3 py-2 flex items-center justify-between border-b-2 border-gray-400 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    {TitleIcon && (
                      <div className="text-white">
                        <TitleIcon className="w-4 h-4" />
                      </div>
                    )}
                    <Text className="text-sm font-bold text-white">
                      {title}
                    </Text>
                  </div>
                  
                  {/* Close Button */}
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={onClose}
                    className="bg-gray-300 hover:bg-red-500 border border-gray-500 text-gray-800 hover:text-white min-w-[24px] min-h-[24px] p-1 transition-colors"
                  >
                    <RiCloseLine className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Window Content */}
                <div className={`bg-white dark:bg-gray-900 p-6 min-h-[400px] max-h-[600px] overflow-y-auto win95-border-inset ${contentClassName}`}>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      {LoadingIcon && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="text-violet-600 dark:text-violet-400"
                        >
                          <LoadingIcon className="w-8 h-8" />
                        </motion.div>
                      )}
                      <Text className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                        {loadingText}
                      </Text>
                    </div>
                  ) : (
                    children
                  )}
                </div>
                
                {/* Window Bottom Border */}
                <div className="h-1 bg-gray-300 dark:bg-gray-700 border-t border-gray-400 dark:border-gray-600" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
