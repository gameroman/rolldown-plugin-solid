import type { JSX } from "solid-js";

// Test TypeScript class features extension
export abstract class BaseComponent {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract render(): JSX.Element;
}

export class DecoratedComponent extends BaseComponent {
  private count: number = 0;

  constructor(name: string) {
    super(name);
  }

  increment(): void {
    this.count++;
  }

  render(): JSX.Element {
    return (
      <div>
        <h2>{this.name}</h2>
        <p>Count: {this.count}</p>
        <button onClick={() => this.increment()}>Increment</button>
      </div>
    );
  }
}

export class GenericComponent<T> {
  private data: T[];

  constructor(data: T[]) {
    this.data = data;
  }

  renderItem(item: T): JSX.Element {
    return <div>{String(item)}</div>;
  }

  render(): JSX.Element {
    return (
      <ul>
        {this.data.map((item) => (
          <li>{this.renderItem(item)}</li>
        ))}
      </ul>
    );
  }
}

export function TestClassFeatures() {
  const component = new DecoratedComponent("Test Component");
  const genericComponent = new GenericComponent([1, 2, 3]);

  return (
    <div>
      {component.render()}
      {genericComponent.render()}
    </div>
  );
}

// Class with parameter properties (no existing constructor)
class ParameterProps {
  constructor(
    public name: string,
    private age: number,
    readonly id: string,
  ) {}
}

// Class with parameter properties and existing constructor
class ParameterPropsWithConstructor {
  private value: string;

  constructor(
    public name: string,
    private count: number,
  ) {
    this.value = name + count;
  }
}

// Derived class with parameter properties
class DerivedParameterProps extends ParameterProps {
  constructor(
    name: string,
    age: number,
    id: string,
    public extra: string,
  ) {
    super(name, age, id);
  }
}

// Class with default parameter values
class DefaultParameterProps {
  constructor(
    public name = "default",
    private value = 42,
  ) {}
}

// Derived class with multiple super calls scenarios
class ComplexDerived extends ParameterPropsWithConstructor {
  private data: string[];

  constructor(
    name: string,
    count: number,
    public items: string[],
  ) {
    super(name, count);
    this.data = items;
  }
}

// Class with parameter properties and complex initialization
class ComplexParameterProps {
  private processed: boolean;

  constructor(
    public input: string,
    private config: { enabled: boolean },
  ) {
    this.processed = config.enabled;
  }
}

export {
  ParameterProps,
  ParameterPropsWithConstructor,
  DerivedParameterProps,
  DefaultParameterProps,
  ComplexDerived,
  ComplexParameterProps,
};
