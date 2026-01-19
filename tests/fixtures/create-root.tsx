import { createRoot, createSignal } from "solid-js";

const Counter = () => {
  const [count, setCount] = createSignal(0);

  return (
    <div class="counter">
      <p>Count: {count()}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
};

let rootContainer: HTMLDivElement | undefined;

const App = () => {
  const [isRootMounted, setIsRootMounted] = createSignal(false);

  const mountRoot = () => {
    if (!rootContainer) {
      rootContainer = document.createElement("div");
      rootContainer.className = "root-container";
      document.body.appendChild(rootContainer);
    }

    createRoot((dispose) => {
      const RootComponent = () => (
        <div class="root-component">
          <h3>Root Component</h3>
          <Counter />
          <button
            onClick={() => {
              dispose();
              setIsRootMounted(false);
              if (rootContainer) {
                document.body.removeChild(rootContainer);
                rootContainer = undefined;
              }
            }}
          >
            Dispose Root
          </button>
        </div>
      );

      return <RootComponent />;
    });

    setIsRootMounted(true);
  };

  return (
    <div class="app">
      <h2>createRoot Example</h2>
      <button onClick={mountRoot} disabled={isRootMounted()}>
        Mount Root
      </button>
      <p>Root mounted: {isRootMounted() ? "Yes" : "No"}</p>
      <Counter />
    </div>
  );
};

export default App;
