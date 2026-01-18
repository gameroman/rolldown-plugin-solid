import { createSignal, Suspense } from "solid-js";

const AsyncComponent = () => {
  const [data, setData] = createSignal<string | null>(null);

  // Simulate async data loading
  setTimeout(() => {
    setData("Async data loaded!");
  }, 1000);

  return (
    <div>
      {data() ? <p>{data()}</p> : <div>Loading async component...</div>}
    </div>
  );
};

const SlowComponent = () => {
  const [items, setItems] = createSignal<string[]>([]);

  // Simulate slower async operation
  setTimeout(() => {
    setItems(["Item 1", "Item 2", "Item 3"]);
  }, 2000);

  return (
    <ul>
      {items().map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
};

const SuspenseDemo = () => {
  const [showComponents, setShowComponents] = createSignal(false);

  return (
    <div>
      <h2>Suspense Demo</h2>
      <button onClick={() => setShowComponents(true)}>
        Load Async Components
      </button>

      {showComponents() && (
        <Suspense fallback={<div>Loading components...</div>}>
          <AsyncComponent />
          <Suspense fallback={<div>Loading slow component...</div>}>
            <SlowComponent />
          </Suspense>
        </Suspense>
      )}
    </div>
  );
};

export default SuspenseDemo;
