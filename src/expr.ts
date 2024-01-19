// generated by generate-ast.ts
import { Token, LiteralValue } from "./token";

export interface Expr {
  accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitTernaryExpr(node: Ternary): T;
  visitBinaryExpr(node: Binary): T;
  visitGroupingExpr(node: Grouping): T;
  visitLiteralExpr(node: Literal): T;
  visitLogicalExpr(node: Logical): T;
  visitUnaryExpr(node: Unary): T;
  visitVariableExpr(node: Variable): T;
  visitAssignExpr(node: Assign): T;
}

export class Ternary implements Expr {
  constructor(
    public condition: Expr,
    public left: Expr,
    public right: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitTernaryExpr(this);
  }
}

export class Binary implements Expr {
  constructor(
    public left: Expr,
    public operator: Token,
    public right: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitBinaryExpr(this);
  }
}

export class Grouping implements Expr {
  constructor(public expression: Expr) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal implements Expr {
  constructor(public value: LiteralValue) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitLiteralExpr(this);
  }
}

export class Logical implements Expr {
  constructor(
    public left: Expr,
    public operator: Token,
    public right: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitLogicalExpr(this);
  }
}

export class Unary implements Expr {
  constructor(
    public operator: Token,
    public right: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitUnaryExpr(this);
  }
}

export class Variable implements Expr {
  constructor(public name: Token) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitVariableExpr(this);
  }
}

export class Assign implements Expr {
  constructor(
    public name: Token,
    public value: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitAssignExpr(this);
  }
}
