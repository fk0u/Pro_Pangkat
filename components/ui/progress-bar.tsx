'use client';

import React, { useEffect, useRef } from 'react';
import styles from '@/styles/ProgressBar.module.css';

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

/**
 * ProgressBar component that uses CSS modules to avoid inline styles
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, className = "" }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Ensure percentage is valid
  const validPercentage = Math.min(Math.max(0, percentage), 100);
  
  useEffect(() => {
    if (progressBarRef.current) {
      // Update width using DOM property instead of inline style
      progressBarRef.current.style.width = `${validPercentage}%`;
    }
  }, [validPercentage]);
  
  return (
    <div className={`${styles.progressBarContainer} ${className}`}>
      <div ref={progressBarRef} className={styles.progressBar} />
    </div>
  );
};

export default ProgressBar;
