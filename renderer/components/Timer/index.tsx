import React, { HTMLProps, useEffect, useRef } from "react";
import { SocketContext } from "../Socket";
import { useContext } from "use-context-selector";
import { DateTime, Duration } from "luxon";

export const formatDiff = (diff: Duration) =>
  diff
    ? `${diff.minutes > 0 ? diff.toFormat(`m:ss`) : diff.toFormat(`s`)}.${diff
        .toFormat("S")
        .padEnd(3, "0")
        .slice(0, 3)}`
    : ``;

export const getDiff = (
  startTimeStr?: string,
  endTimeStr?: string,
  millisOffset: number = 0
) => {
  const startTime = DateTime.fromISO(startTimeStr);
  let endTime: DateTime;
  if (!endTimeStr)
    endTime = DateTime.now().plus({ milliseconds: millisOffset });
  else endTime = DateTime.fromISO(endTimeStr);
  if (!endTime || endTime < startTime)
    endTime = DateTime.now().plus({ milliseconds: millisOffset });
  return endTime.diff(startTime, ["minutes", "seconds", "milliseconds"]);
};

const Timer = (props: { playerIndex: number } & HTMLProps<HTMLDivElement>) => {
  const { gameState, timeOffset } = useContext(SocketContext);
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
      } else {
        const diff = getDiff(startTimeStr, endTimeStr, timeOffset);
        timerRef.current.textContent = formatDiff(diff);
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

  return (
    <>
      <div {...rest} ref={timerRef}></div>
    </>
  );
};

export default Timer;
