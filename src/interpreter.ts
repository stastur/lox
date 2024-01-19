import { TokenType } from "./token";
import * as Expr from "./expr";
import * as Stmt from "./stmt";
import { Environment } from "./environment";

export class Interpreter implements Expr.Visitor<unknown>, Stmt.Visitor<void> {
  environment = new Environment();

  visitAssignExpr(node: Expr.Assign): unknown {
    const value = this.evaluate(node.value);
    this.environment.assign(node.name, value);
    return value;
  }

  visitVariableExpr(node: Expr.Variable): unknown {
    return this.environment.get(node.name);
  }

  visitBlockStmt(node: Stmt.Block): void {
    this.executeBlock(node.statements, new Environment(this.environment));
  }

  visitExpressionStmt(node: Stmt.Expression): void {
    this.evaluate(node.expression);
  }

  visitIfStmt(node: Stmt.If): void {
    const condition = this.evaluate(node.condition);
    if (condition) {
      this.execute(node.thenBranch);
    } else if (node.elseBranch) {
      this.execute(node.elseBranch);
    }
  }

  visitPrintStmt(node: Stmt.Print): void {
    const value = this.evaluate(node.expression);
    console.log(this.stringify(value));
  }

  visitVarStmt(node: Stmt.Var): void {
    let value: unknown;
    if (node.initializer) {
      value = this.evaluate(node.initializer);
    }

    this.environment.define(node.name, value);
  }

  visitBreakStmt(): void {
    throw new BreakException();
  }

  visitWhileStmt(node: Stmt.While): void {
    try {
      while (this.evaluate(node.condition)) {
        this.execute(node.body);
      }
    } catch (error) {
      if (error instanceof BreakException) {
      } else throw error;
    }
  }

  evaluate(expr: Expr.Expr) {
    return expr.accept(this);
  }

  visitTernaryExpr(node: Expr.Ternary): unknown {
    const condition = this.evaluate(node.condition);

    if (condition) {
      return this.evaluate(node.left);
    } else {
      return this.evaluate(node.right);
    }
  }

  visitLogicalExpr(node: Expr.Logical): unknown {
    const left = this.evaluate(node.left);

    if (node.operator.type === TokenType.OR) {
      return left || this.evaluate(node.right);
    }
    if (node.operator.type === TokenType.AND) {
      return left && this.evaluate(node.right);
    }
  }

  visitBinaryExpr(node: Expr.Binary): unknown {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    switch (node.operator.type) {
      case TokenType.MINUS:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left - right;

      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        }
        throw new Error("Operands must be two numbers or two strings.");

      case TokenType.SLASH:
        checkNumberOperand(left);
        checkNumberOperand(right);
        if (right === 0) throw new Error("Division by zero.");

        return left / right;

      case TokenType.STAR:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left * right;

      case TokenType.GREATER:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left > right;

      case TokenType.GREATER_EQUAL:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left >= right;

      case TokenType.LESS:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left < right;

      case TokenType.LESS_EQUAL:
        checkNumberOperand(left);
        checkNumberOperand(right);
        return left <= right;

      case TokenType.BANG_EQUAL:
        return left !== right;

      case TokenType.EQUAL_EQUAL:
        return left === right;

      case TokenType.COMMA:
        return right;

      default:
        throw new Error("Invalid binary operator.");
    }
  }

  visitGroupingExpr(node: Expr.Grouping): unknown {
    return this.evaluate(node.expression);
  }

  visitLiteralExpr(node: Expr.Literal): unknown {
    return node.value;
  }

  visitUnaryExpr(node: Expr.Unary): unknown {
    const value = this.evaluate(node.right);

    switch (node.operator.type) {
      case TokenType.MINUS:
        checkNumberOperand(value);
        return -value;
      case TokenType.BANG:
        return !value;
      default:
        throw new Error("Invalid unary operator.");
    }
  }

  stringify(value: unknown): string {
    if (value === null || value === undefined) return "nil";

    return String(value);
  }

  interpret(statements: Stmt.Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      console.error(error);
    }
  }

  execute(stmt: Stmt.Stmt) {
    stmt.accept(this);
  }

  executeBlock(statements: Stmt.Stmt[], environment: Environment) {
    const previous = this.environment;

    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }
}

function checkNumberOperand(operand: unknown): asserts operand is number {
  if (typeof operand !== "number")
    throw new Error(`Operand must be a number. Got ${typeof operand} instead.`);
}

class BreakException extends Error {}
