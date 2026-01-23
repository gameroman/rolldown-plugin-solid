// Test various HTML validation scenarios
export function TestValidation() {
  // This should test validation of well-formed HTML
  return (
    <div>
      <p>Well-formed HTML</p>
    </div>
  );
}

export function TestTableElements() {
  // Test table-specific validation
  return (
    <table>
      <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
      </tr>
    </table>
  );
}

export function TestVoidElements() {
  // Test void element handling
  return <img src="test.jpg" alt="test" />;
}

export function TestNestedElements() {
  // Test deeply nested elements
  return (
    <div>
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
    </div>
  );
}
