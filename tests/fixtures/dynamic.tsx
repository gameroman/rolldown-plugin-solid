import { type Component, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";

const Button: Component<{ text: string; onClick: () => void }> = (props) => (
  <button onClick={props.onClick}>{props.text}</button>
);

const Card: Component<{ title: string; content: string }> = (props) => (
  <div class="card">
    <h3>{props.title}</h3>
    <p>{props.content}</p>
  </div>
);

const List: Component<{ items: string[] }> = (props) => (
  <ul>
    {props.items.map((item) => (
      <li>{item}</li>
    ))}
  </ul>
);

const App = () => {
  const [selectedComponent, setSelectedComponent] =
    createSignal<Component<any>>(Button);
  const [componentProps, setComponentProps] = createSignal<Record<string, any>>(
    {
      text: "Click me",
      onClick: () => alert("Button clicked!"),
    },
  );

  const components = [
    { name: "Button", component: Button },
    { name: "Card", component: Card },
    { name: "List", component: List },
  ];

  const switchComponent = (name: string) => {
    const found = components.find((c) => c.name === name);
    if (found) {
      setSelectedComponent(() => found.component);

      if (name === "Button") {
        setComponentProps({
          text: "Dynamic Button",
          onClick: () => alert("Dynamic button clicked!"),
        });
      } else if (name === "Card") {
        setComponentProps({
          title: "Dynamic Card",
          content: "This card is rendered dynamically",
        });
      } else if (name === "List") {
        setComponentProps({
          items: ["Item 1", "Item 2", "Item 3"],
        });
      }
    }
  };

  return (
    <div class="dynamic-example">
      <h2>Dynamic Component Example</h2>
      <div class="controls">
        {components.map((comp) => (
          <button onClick={() => switchComponent(comp.name)}>
            {comp.name}
          </button>
        ))}
      </div>

      <div class="dynamic-container">
        <Dynamic component={selectedComponent()} {...componentProps()} />
      </div>

      <div class="conditional-dynamic">
        <h3>Conditional Dynamic Rendering</h3>
        <button
          onClick={() =>
            setSelectedComponent(() => () => <div>No Component</div>)
          }
        >
          Clear Component
        </button>
        <button onClick={() => switchComponent("Button")}>
          Show Button Again
        </button>
      </div>
    </div>
  );
};

export default App;
