# @rolldown-plugin/solid

A Rolldown plugin for compiling SolidJS JSX/TSX files.

**This is a fork of [rolldown-plugin-solid](https://github.com/g-mero/rolldown-plugin-solid)**

## Installation

```bash
# Using bun
bun add -d @rolldown-plugin/solid

# Using pnpm
pnpm add -D @rolldown-plugin/solid

# Using npm
npm install --save-dev @rolldown-plugin/solid

# Using yarn
yarn add --dev @rolldown-plugin/solid
```

## Usage

### Basic Setup

Create a `rolldown.config.js` file in your project root:

```javascript
import { defineConfig } from 'rolldown';
import solid from '@rolldown-plugin/solid';

export default defineConfig({
  input: 'src/index.tsx',
  plugins: [
    solid()
  ],
});
```

## Configuration Options

The plugin accepts an options object with the following properties:

### Basic Options

```typescript
interface Options {
  /** TypeScript preset options */
  typescript?: object;
    
  /** Solid-specific options */
  solid?: SolidOptions;
}
```

### Solid Options

```typescript
interface SolidOptions {
  /** Runtime module name @default "solid-js/web" */
  moduleName?: string;
  
  /** Output mode @default "dom" */
  generate?: 'ssr' | 'dom' | 'universal';
  
  /** Enable hydration markers @default false */
  hydratable?: boolean;
  
  /** Enable automatic event delegation @default true */
  delegateEvents?: boolean;
  
  /** Enable smart conditional detection @default true */
  wrapConditionals?: boolean;
  
  /** Set render context on Custom Elements @default true */
  contextToCustomElements?: boolean;
  
  /** Built-in components to auto-import */
  builtIns?: string[];
}
```

### Basic SolidJS App

```typescript
// src/App.tsx
import { createSignal } from 'solid-js';

export default function App() {
  const [count, setCount] = createSignal(0);
  
  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => setCount(count() + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### SSR Configuration

```javascript
// rolldown.config.js
import { defineConfig } from 'rolldown';
import solid from '@rolldown-plugin/solid';

export default defineConfig({
  input: 'src/server.tsx',
  plugins: [
    solid({
      solid: {
        generate: 'ssr',
        hydratable: true
      }
    })
  ],
});
```

### Advanced Configuration

```javascript
// rolldown.config.js
import { defineConfig } from 'rolldown';
import solid from '@rolldown-plugin/solid';

export default defineConfig({
  input: 'src/index.tsx',
  plugins: [
    solid({
      // TypeScript options
      typescript: {
        onlyRemoveTypeImports: true
      },
      
      // Solid options
      solid: {
        moduleName: 'solid-js/web',
        generate: 'dom',
        hydratable: false,
        delegateEvents: true,
        wrapConditionals: true,
        contextToCustomElements: true,
        builtIns: [
          'For', 'Show', 'Switch', 'Match',
          'Suspense', 'SuspenseList', 'Portal',
          'Index', 'Dynamic', 'ErrorBoundary'
        ]
      },
    })
  ],
});
```

### Universal/Isomorphic Setup

```javascript
// rolldown.config.js
import { defineConfig } from 'rolldown';
import solid from '@rolldown-plugin/solid';

export default defineConfig({
  input: 'src/index.tsx',
  plugins: [
    solid({
      solid: {
        generate: 'universal',
        moduleName: 'solid-js/universal'
      }
    })
  ],
});
```

## Related Projects

- [Rolldown](https://github.com/rolldown/rolldown) - Fast Rust-based bundler
- [SolidJS](https://github.com/solidjs/solid) - Simple and performant reactivity
- [rolldown-plugin-solid](https://github.com/g-mero/rolldown-plugin-solid) - Original plugin for rolldown
- [babel-preset-solid](https://github.com/solidjs/solid/tree/main/packages/babel-preset-solid) - Babel preset for Solid
