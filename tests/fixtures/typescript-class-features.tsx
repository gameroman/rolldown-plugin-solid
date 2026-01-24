// Test fixture for TypeScript class features to improve coverage

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
