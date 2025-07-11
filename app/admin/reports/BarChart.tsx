'use client';

import { useEffect, useState } from 'react';
import styles from './BarChart.module.css';

interface MonthlyData {
  month: string;
  count: number;
}

interface BarChartProps {
  data: MonthlyData[];
}

export default function BarChart({ data }: BarChartProps) {
  const [animatedData, setAnimatedData] = useState<MonthlyData[]>(
    data.map(item => ({ ...item, count: 0 }))
  );

  // Animate the bars on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 300);

    return () => clearTimeout(timer);
  }, [data]);

  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className={styles.barContainer}>
      <div className={styles.barsWrapper}>
        {animatedData.map((item, index) => {
          // Calculate height percentage (1-100)
          const barHeight = maxCount > 0 
            ? Math.max(1, Math.round((item.count / maxCount) * 100)) 
            : 1;
          
          // Get the corresponding height class
          const heightClass = styles[`h-${barHeight}`];
          
          return (
            <div key={index} className={styles.barColumn}>
              <div className={styles.barWrapper}>
                <div
                  className={`${styles.bar} ${item.count > 0 ? styles.barActive : styles.barInactive} ${heightClass}`}
                >
                  <div className={styles.barLabel}>
                    {item.count}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.monthsContainer}>
        {data.map((item, index) => (
          <div key={index} className={styles.monthLabel}>
            {item.month}
          </div>
        ))}
      </div>
    </div>
  );
}
