import { useState, useEffect, useRef } from "react";

export function useTypingEffect(target: string, speed = 15) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (indexRef.current >= target.length) {
      setIsTyping(false);
      setDisplayed(target);
      return;
    }

    setIsTyping(true);
    const interval = setInterval(() => {
      indexRef.current += 1;
      const next = target.slice(0, indexRef.current);
      setDisplayed(next);
      if (indexRef.current >= target.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [target, speed]);

  return { displayed, isTyping };
}
