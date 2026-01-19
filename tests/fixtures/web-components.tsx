import {
  type Accessor,
  createContext,
  createSignal,
  type ParentComponent,
  useContext,
} from "solid-js";

// Define a theme context for testing custom elements integration
interface ThemeContextType {
  theme: Accessor<"light" | "dark">;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

// Custom Element wrapper that uses SolidJS context
const CustomElementWrapper = () => {
  const context = useContext(ThemeContext);

  const toggleTheme = context?.toggleTheme || (() => {});
  const theme = context?.theme?.() || "light";

  // Simulate custom element behavior within Solid component
  return (
    <div
      style={`background: ${theme === "light" ? "#f0f0f0" : "#1a1a1a"}; color: ${theme === "light" ? "#000" : "#fff"}; padding: 1rem; border-radius: 4px; border: 1px solid ${theme === "light" ? "#ccc" : "#555"};`}
    >
      <h3>Custom Element Simulation</h3>
      <p>Simulated Custom Element Theme: {theme}</p>
      <button onClick={toggleTheme}>
        Toggle Theme (via Custom Element Sim)
      </button>
      <div style="margin-top: 1rem;">
        <slot>
          <p>This simulates slotted content inheriting theme context</p>
        </slot>
      </div>
    </div>
  );
};

const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

const RegularSolidComponent = () => {
  const context = useContext(ThemeContext);
  if (!context) return <div>No theme context</div>;
  const { theme, toggleTheme } = context;

  return (
    <div
      style={`background: ${theme() === "light" ? "#fff" : "#333"}; color: ${theme() === "light" ? "#000" : "#fff"}; padding: 1rem; margin: 1rem; border-radius: 4px;`}
    >
      <p>Regular Solid Component Theme: {theme()}</p>
      <button onClick={toggleTheme}>Toggle Theme (via Solid Component)</button>
    </div>
  );
};

// Component that tests context boundaries
const NestedContextTest = () => {
  const context = useContext(ThemeContext);

  return (
    <div
      style={`background: ${context?.theme?.() === "light" ? "#f9f9f9" : "#2a2a2a"}; color: ${context?.theme?.() === "light" ? "#000" : "#fff"}; padding: 1rem; margin: 1rem; border-radius: 4px;`}
    >
      <h4>Nested Context Test</h4>
      <p>Theme accessible here: {context?.theme?.()}</p>
      <CustomElementWrapper />
    </div>
  );
};

// Main component testing web components integration scenarios
const WebComponentsIntegration = () => {
  return (
    <ThemeProvider>
      <div>
        <h2>Web Components + SolidJS Context Integration</h2>
        <RegularSolidComponent />
        <CustomElementWrapper />
        <div style="margin: 1rem;">
          <h3>Context Boundary Testing</h3>
          <NestedContextTest />
        </div>
        <div
          style={`padding: 1rem; margin: 1rem; border: 1px solid #ccc; border-radius: 4px;`}
        >
          <h3>Simulated Shadow DOM with Slots</h3>
          <div
            style={`background: var(--theme-bg, #fff); color: var(--theme-color, #000); padding: 1rem;`}
          >
            <p>This simulates content inside shadow DOM</p>
            <slot>Default slot content</slot>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default WebComponentsIntegration;
