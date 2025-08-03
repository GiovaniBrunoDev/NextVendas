import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, format = v => v.toFixed(2), duration = 500 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const raf = useRef(null);
  const start = useRef(null);
  const from = useRef(value);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    start.current = null;
    from.current = displayValue;

    const animate = timestamp => {
      if (!start.current) start.current = timestamp;
      const progress = Math.min((timestamp - start.current) / duration, 1);
      const newValue = from.current + (value - from.current) * progress;
      setDisplayValue(newValue);
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
}