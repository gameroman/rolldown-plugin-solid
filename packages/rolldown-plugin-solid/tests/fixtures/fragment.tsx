import { createSignal } from "solid-js";

const ChildComponent = () => {
  const [message, setMessage] = createSignal("Hello from child!");

  return (
    <>
      <h2>Child Component</h2>
      <p>{message()}</p>
      <button onClick={() => setMessage("Updated message!")}>
        Update Message
      </button>
    </>
  );
};

const App = () => {
  const [count, setCount] = createSignal(0);

  return (
    <>
      <h1>Fragment Example</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <ChildComponent />
    </>
  );
};

export default App;
