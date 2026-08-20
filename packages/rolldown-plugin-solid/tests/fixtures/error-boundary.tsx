import { createSignal, ErrorBoundary } from "solid-js";

const ErrorProneComponent = () => {
  const [shouldError, setShouldError] = createSignal(false);

  if (shouldError()) {
    throw new Error("This is a test error!");
  }

  return (
    <div>
      <p>This component works fine</p>
      <button onClick={() => setShouldError(true)}>Trigger Error</button>
    </div>
  );
};

const AsyncErrorComponent = () => {
  const [shouldError, setShouldError] = createSignal(false);

  const processData = () => {
    if (shouldError()) {
      throw new Error("Async processing failed!");
    }
    return "Data processed successfully";
  };

  return (
    <div>
      <p>Result: {processData()}</p>
      <button onClick={() => setShouldError(true)}>Trigger Async Error</button>
    </div>
  );
};

const NestedErrorComponent = () => {
  const [level, setLevel] = createSignal(1);

  const DeepComponent = () => {
    if (level() > 2) {
      throw new Error("Deep nested error");
    }
    return <p>Deep component level {level()}</p>;
  };

  return (
    <div>
      <h3>Nested Error Boundary</h3>
      <button onClick={() => setLevel((l) => l + 1)}>
        Increase Level (Current: {level()})
      </button>
      <ErrorBoundary
        fallback={(err, reset) => (
          <div>
            <p>Inner Error Boundary: {err.message}</p>
            <button onClick={reset}>Reset Inner</button>
          </div>
        )}
      >
        <DeepComponent />
      </ErrorBoundary>
    </div>
  );
};

const ErrorBoundaryDemo = () => {
  return (
    <div>
      <h2>Error Boundary Demo</h2>

      <ErrorBoundary
        fallback={(err, reset) => (
          <div>
            <h3>Something went wrong!</h3>
            <p>Error: {err.message}</p>
            <button onClick={reset}>Try Again</button>
          </div>
        )}
      >
        <ErrorProneComponent />
        <AsyncErrorComponent />
        <NestedErrorComponent />
      </ErrorBoundary>
    </div>
  );
};

export default ErrorBoundaryDemo;
