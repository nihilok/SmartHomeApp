import * as React from "react";

interface Props {
  endTime: number;
}

export function CountDown({ endTime }: Props) {
  const [remaining, setRemaining] = React.useState("");

  React.useEffect(() => {
    function countDown() {
      const timeLeft = endTime - Date.now() / 1000;
      const minutes = Math.floor((timeLeft % (60 * 60 * 24)) / 60);
      const seconds = Math.floor(timeLeft % 60);
      setRemaining(
        `${minutes}:${seconds > 10 ? seconds : `${0}${seconds}`} remaining`
      );
    }
    countDown();
    let interval: ReturnType<typeof setInterval>;
    interval = setInterval(countDown, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <div>{remaining}</div>;
}
