import { createSignal, type ParentComponent } from "solid-js";

const Card: ParentComponent<{ title?: string }> = (props) => {
  return (
    <div className="card">
      {props.title && <h2>{props.title}</h2>}
      <div className="card-content">{props.children}</div>
    </div>
  );
};

const App = () => {
  const [showContent, setShowContent] = createSignal(true);

  return (
    <Card title="Test Card">
      <p>This is card content</p>
      {showContent() && <p>Conditional content</p>}
      <button onClick={() => setShowContent((s) => !s)}>Toggle Content</button>
    </Card>
  );
};

export default App;
