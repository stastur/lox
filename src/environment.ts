import { Token } from "./token";

export class Environment {
  private values = new Map<string, unknown>();

  constructor(private enclosing?: Environment) {}

  define(name: Token, value: unknown) {
    this.values.set(name.lexeme, value);
  }

  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      const value = this.values.get(name.lexeme);

      if (value === undefined) {
        throw new Error(`Access to uninitialized variable '${name.lexeme}'.`);
      }

      return this.values.get(name.lexeme);
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new Error(`Undefined variable '${name.lexeme}'.`);
  }

  assign(name: Token, value: unknown) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new Error(`Undefined variable '${name.lexeme}'.`);
  }
}
