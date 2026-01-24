import { createSignal } from "solid-js";

export function TestUniversalElements() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      {/* Basic interactive element */}
      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>

      {/* SVG mixed with HTML */}
      <svg width="100" height="100">
        <circle cx="50" cy="50" r={count()} fill="blue" />
      </svg>

      {/* Complex nested structure */}
      <ul>
        {[1, 2, 3].map((item) => (
          <li data-key={item.toString()}>Item {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TestUniversalConditional() {
  const [show, setShow] = createSignal(true);
  const [items] = createSignal([1, 2, 3]);

  return (
    <div>
      {show() && (
        <div>
          <h2>Conditional Content</h2>
          <p>This is conditionally rendered</p>
        </div>
      )}

      <button onClick={() => setShow(!show())}>Toggle</button>

      {items().map((item) => (
        <div data-id={item}>Item {item}</div>
      ))}
    </div>
  );
}
