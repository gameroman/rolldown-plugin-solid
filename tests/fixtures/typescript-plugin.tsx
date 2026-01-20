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
