import React, { HTMLProps, useEffect, useRef } from "react";
import { SocketContext } from "../Socket";
import { useContext } from "use-context-selector";
import { DateTime } from "luxon";

const Timer = (props: { playerIndex: number } & HTMLProps<HTMLDivElement>) => {
  const { gameState } = useContext(SocketContext);
  const { playerIndex, ...rest } = props;

  const timerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!timerRef.current) return;

    const interval = setInterval(() => {
      if (!timerRef.current) return;

      const startTimeStr = gameState[`player-${playerIndex}`]?.startTime;
      const endTimeStr = gameState[`player-${playerIndex}`]?.endTime;

      if (!startTimeStr) {
        timerRef.current.textContent = "00:00";
      } else if (!endTimeStr) {
        const startTime = DateTime.fromISO(startTimeStr);
        let endTime = DateTime.now();
        const diff = endTime.diff(startTime);
        timerRef.current.textContent = diff.toFormat("mm:ss.S");
      } else {
        const startTime = DateTime.fromISO(startTimeStr);
        let endTime = DateTime.fromISO(endTimeStr);
        if (!endTime || endTime < startTime) endTime = DateTime.now();
        const diff = endTime.diff(startTime);
        timerRef.current.textContent = diff.toFormat("mm:ss.S");
      }
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [
    gameState[`player-${playerIndex}`]?.startTime,
    gameState[`player-${playerIndex}`]?.endTime,
    timerRef.current,
  ]);

  return <div {...rest} ref={timerRef}></div>;
};

export default Timer;
