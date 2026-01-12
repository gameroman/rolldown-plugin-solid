import { createSignal } from 'solid-js';

const Counter = () => {
  const [count, setCount] = createSignal(0);
  const inc = () => setCount((c) => c + 1);
  const dec = () => setCount((c) => c - 1);

  return (
    <div className="counter">
      <h1>Count: {count()}</h1>
      <button onClick={inc}>+</button>
      <button onClick={dec}>-</button>
    </div>
  );
};

export default Counter;
