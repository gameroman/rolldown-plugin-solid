import { createSignal } from "solid-js";

interface Props {
  initialCount?: number;
  step?: number;
}

const Counter = (props: Props) => {
  const [count, setCount] = createSignal(props.initialCount || 0);
  const step = props.step || 1;

  const inc = () => setCount((c) => c + step);
  const dec = () => setCount((c) => c - step);

  return (
    <div className="counter">
      <h1>Count: {count()}</h1>
      <button onClick={inc}>+{step}</button>
      <button onClick={dec}>-{step}</button>
    </div>
  );
};

export default Counter;
