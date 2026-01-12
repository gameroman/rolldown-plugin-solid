import { createEffect, createSignal, onCleanup } from "solid-js";

const Timer = () => {
  const [count, setCount] = createSignal(0);
  const [isRunning, setIsRunning] = createSignal(false);

  createEffect(() => {
    if (isRunning()) {
      const interval = setInterval(() => {
        setCount((c) => c + 1);
      }, 1000);

      onCleanup(() => {
        clearInterval(interval);
      });
    }
  });

  const toggle = () => setIsRunning((r) => !r);
  const reset = () => {
    setCount(0);
    setIsRunning(false);
  };

  return (
    <div className="timer">
      <h2>Timer: {count()}s</h2>
      <button onClick={toggle}>{isRunning() ? "Pause" : "Start"}</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

export default Timer;
