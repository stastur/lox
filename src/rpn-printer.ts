import * as Expr from "./expr";

export class RpnPrinter implements Expr.Visitor<string> {
  visitLogicalExpr(node: Expr.Logical): string {
    throw new Error("Method not implemented.");
  }

  visitAssignExpr(node: Expr.Assign): string {
    throw new Error("Method not implemented.");
  }

  visitVariableExpr(node: Expr.Variable): string {
    throw new Error("Method not implemented.");
  }

  visitTernaryExpr(node: Expr.Ternary): string {
    throw new Error("Method not implemented.");
  }

  print(expr: Expr.Expr) {
    return expr.accept(this);
  }

  visitBinaryExpr(node: Expr.Binary): string {
    return `${node.left.accept(this)} ${node.right.accept(this)} ${
      node.operator.lexeme
    }`;
  }

  visitGroupingExpr(node: Expr.Grouping): string {
    return node.expression.accept(this);
  }

  visitLiteralExpr(node: Expr.Literal): string {
    if (node.value === null) return "nil";
    return node.value.toString();
  }

  visitUnaryExpr(node: Expr.Unary): string {
    return `${node.right.accept(this)} ${node.operator.lexeme}`;
  }
}
