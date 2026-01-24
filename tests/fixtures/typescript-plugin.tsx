const enum Enum4 {
  Foo,
  Bar,
  Baz,
}

const text = "text";

enum Enum1 {
  Foo,
  Bar,
  Baz,
}

enum Enum2 {
  Foo = "FOO",
  Bar = "BAR",
  Baz = "BAZ",
}

class Class1 {
  prop1: string;

  constructor(prop1: string) {
    this.prop1 = prop1;
  }

  method1(): void {
    console.log(this.prop1);
  }
}

class Class2<T> extends Class1 {
  prop2: T;

  constructor(prop1: string, prop2: T) {
    super(prop1);
    this.prop2 = prop2;
  }

  method2(): T {
    return this.prop2;
  }
}

type Type1 = {
  prop1: string;
  method1: () => void;
};

type Type2<T> = {
  prop2: T;
  method2: () => T;
};

interface Interface1 {
  prop1: string;
  method1: () => void;
}

export interface Interface2<T> {
  prop2: T;
  method2: () => T;
}

export type Type3 = {
  prop3: string;
  method3: () => void;
};

export namespace Namespace1 {
  export enum Enum3 {
    Foo,
    Bar,
    Baz,
  }
}

export { Enum1, Enum2, Class1, Class2 };
export type { Type1, Type2 };
export { type Interface1 };
export { text, Enum4 };

// Test TypeScript namespace functionality
namespace Utils {
  export const PI = 3.14159;

  export function calculateArea(radius: number): number {
    return PI * radius * radius;
  }

  export namespace Shapes {
    export interface Shape {
      area(): number;
    }

    export class Circle implements Shape {
      constructor(private radius: number) {}

      area(): number {
        return Utils.calculateArea(this.radius);
      }
    }
  }
}

namespace Config {
  export const API_URL = "https://api.example.com";
  export const VERSION = "1.0.0";

  export namespace Features {
    export const FEATURE_A = true;
    export const FEATURE_B = false;
  }
}

export function TestNamespace() {
  const circle = new Utils.Shapes.Circle(5);
  const area = circle.area();

  return (
    <div>
      <h2>Namespace Test</h2>
      <p>Circle area: {area}</p>
      <p>API URL: {Config.API_URL}</p>
      <p>Version: {Config.VERSION}</p>
      <p>Feature A: {Config.Features.FEATURE_A ? "Enabled" : "Disabled"}</p>
    </div>
  );
}
