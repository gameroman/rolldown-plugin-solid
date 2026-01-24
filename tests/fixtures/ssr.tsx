import { createSignal } from "solid-js";
import { renderToString } from "solid-js/web";

export function TestSSRSpecialElements() {
  const [show] = createSignal(true);

  return (
    <div>
      {/* Script and style elements */}
      <script>{`console.log('test')`}</script>
      <style>{`body { margin: 0; }`}</style>

      {/* Custom elements using div as proxy */}
      <div data-custom-element="true" data-test="value">
        <span>Nested content</span>
      </div>

      {/* Conditional rendering */}
      {show() && <div>Conditional content</div>}

      {/* Dynamic attributes */}
      <div class={show() ? "active" : "inactive"}>Dynamic class</div>
    </div>
  );
}

export function TestSSRComplexStructure() {
  const items = [1, 2, 3];

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr data-key={item}>
            <td>{item}</td>
            <td>Value {item}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const App = () => {
  const [count, setCount] = createSignal(0);
  const inc = (by = 1) => setCount(count() + by);

  return (
    <button onClick={() => inc(1)} type="button">
      {count()}
    </button>
  );
};

export default renderToString(App);
