// Test hydratable root elements with hydratable=true config
export function TestHydratableHtml() {
  return (
    <html>
      <head>
        <title>Hydratable HTML</title>
      </head>
      <body>
        <div>Content</div>
      </body>
    </html>
  );
}

export function TestHydratableHead() {
  return (
    <head>
      <title>Hydratable Head</title>
      <meta charset="utf-8" />
    </head>
  );
}

export function TestHydratableBody() {
  return (
    <body>
      <div>Hydratable body content</div>
    </body>
  );
}
