// Test SVG element wrapping functionality
export function TestSvgWrap() {
  return (
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="red" />
      <foreignObject x="10" y="10" width="80" height="80">
        <div>
          <p>HTML content inside SVG</p>
        </div>
      </foreignObject>
    </svg>
  );
}

export function TestNestedSvg() {
  return (
    <div>
      <svg>
        <g>
          <rect x="0" y="0" width="100" height="100" />
        </g>
      </svg>
    </div>
  );
}

// Test event delegation scenarios (exercises postprocess.ts)
export function TestEventDelegation() {
  return (
    <div>
      <button onClick={() => console.log("click")}>Click me</button>
      <div onMouseOver={() => console.log("hover")}>Hover me</div>
      <input onInput={(e) => console.log(e.target.value)} />
      <form onSubmit={(e) => e.preventDefault()}>
        <select onChange={(e) => console.log(e.target.value)}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </select>
      </form>
    </div>
  );
}

// Test complex template scenarios with dynamic content
export function TestComplexTemplates() {
  const items = ["a", "b", "c"];
  const show = true;

  return (
    <div class="container">
      <h1>Title</h1>
      {show && <p>Conditional content</p>}
      <ul>
        {items.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
      <div style={{ color: "red", "font-size": "16px" }}>Styled content</div>
    </div>
  );
}

// Test template with various attributes
export function TestAttributeTemplates() {
  return (
    <div
      id="test"
      class="my-class"
      data-testid="element"
      aria-label="Accessible element"
      role="button"
      tabIndex={0}
    >
      <img src="test.jpg" alt="test image" width="100" height="100" />
      <input type="text" placeholder="Enter text" required disabled={false} />
    </div>
  );
}

// Test SVG elements (different namespace)
export function TestSVGTemplates() {
  return (
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="40" fill="red" />
      <rect x="10" y="10" width="30" height="30" fill="blue" />
      <text x="50" y="50" text-anchor="middle">
        SVG Text
      </text>
    </svg>
  );
}

// Test SSR-specific template functionality
export function TestSSRHeadElement() {
  return (
    <head>
      <title>SSR Test</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
    </head>
  );
}

export function TestSSRScriptStyle() {
  return (
    <div>
      <script>{`console.log('test');`}</script>
      <style>{`body { margin: 0; }`}</style>
    </div>
  );
}

export function TestSSRHydration() {
  return (
    <div>
      <p>Static content</p>
      <div>{`Dynamic content: ${Date.now()}`}</div>
      <ul>
        {[1, 2, 3].map((item) => (
          <li>Item {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TestSSRSpreadAttributes() {
  const props = {
    class: "dynamic-class",
    id: "dynamic-id",
    "data-test": "value",
  };

  return <div {...props}>Spread attributes</div>;
}

export function TestSSRSpecialElements() {
  return (
    <table>
      <thead>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
      </tbody>
    </table>
  );
}

// Test various HTML validation scenarios
export function TestValidationScenarios() {
  // This exercises validate.ts functionality
  return (
    <div>
      {/* Nested elements */}
      <section>
        <article>
          <header>
            <h1>Title</h1>
          </header>
          <main>
            <p>Content</p>
          </main>
          <footer>
            <small>Footer</small>
          </footer>
        </article>
      </section>

      {/* Table elements */}
      <table>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
      </table>

      {/* Void elements */}
      <img src="test.jpg" alt="test" />
      <br />
      <hr />
    </div>
  );
}
