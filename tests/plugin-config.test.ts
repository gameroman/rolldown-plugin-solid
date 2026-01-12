import { describe, it, expect } from 'bun:test';
import solidPlugin from '../src';

describe('Plugin Configuration', () => {
  it('should create plugin with default options', () => {
    const plugin = solidPlugin();

    expect(plugin).toBeDefined();
  });

  it('should create plugin with custom options', () => {
    const customOptions = {
      solid: {
        generate: 'ssr' as const,
        hydratable: true,
      },
    };

    const plugin = solidPlugin(customOptions);

    expect(plugin).toBeDefined();
  });
});
