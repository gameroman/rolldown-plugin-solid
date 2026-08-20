import { createSignal } from "solid-js";

// Test data-hk attribute warning (should trigger console warning)
export function TestDataHkAttribute() {
  const [count, setCount] = createSignal(0);

  return (
    <div data-hk="some-value">
      <button onClick={() => setCount(count() + 1)}>{count()}</button>
    </div>
  );
}
