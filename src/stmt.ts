// generated by generate-ast.ts
import { Token } from "./token";
import { Expr } from "./expr";

export interface Stmt {
  accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
  visitBlockStmt(node: Block): T;
  visitExpressionStmt(node: Expression): T;
  visitIfStmt(node: If): T;
  visitPrintStmt(node: Print): T;
  visitVarStmt(node: Var): T;
  visitWhileStmt(node: While): T;
  visitBreakStmt(node: Break): T;
}

export class Block implements Stmt {
  constructor(public statements: Stmt[]) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitBlockStmt(this);
  }
}

export class Expression implements Stmt {
  constructor(public expression: Expr) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitExpressionStmt(this);
  }
}

export class If implements Stmt {
  constructor(
    public condition: Expr,
    public thenBranch: Stmt,
    public elseBranch: Stmt | undefined,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitIfStmt(this);
  }
}

export class Print implements Stmt {
  constructor(public expression: Expr) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitPrintStmt(this);
  }
}

export class Var implements Stmt {
  constructor(
    public name: Token,
    public initializer: Expr,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitVarStmt(this);
  }
}

export class While implements Stmt {
  constructor(
    public condition: Expr,
    public body: Stmt,
  ) {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitWhileStmt(this);
  }
}

export class Break implements Stmt {
  constructor() {}

  accept<T>(visitor: Visitor<T>) {
    return visitor.visitBreakStmt(this);
  }
}
