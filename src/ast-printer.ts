import * as Expr from "./expr";

export class AstPrinter implements Expr.Visitor<string> {
  visitLogicalExpr(node: Expr.Logical): string {
    throw new Error("Method not implemented.");
  }

  visitAssignExpr(node: Expr.Assign): string {
    return this.parenthesize(node.name.lexeme, node.value);
  }

  visitVariableExpr(node: Expr.Variable): string {
    return node.name.lexeme;
  }

  print(expr: Expr.Expr) {
    return expr.accept(this);
  }

  visitBinaryExpr(node: Expr.Binary): string {
    return this.parenthesize(node.operator.lexeme, node.left, node.right);
  }

  visitGroupingExpr(node: Expr.Grouping): string {
    return this.parenthesize("group", node.expression);
  }

  visitLiteralExpr(node: Expr.Literal): string {
    if (node.value === null) return "nil";
    return node.value.toString();
  }

  visitUnaryExpr(node: Expr.Unary): string {
    return this.parenthesize(node.operator.lexeme, node.right);
  }

  visitTernaryExpr(node: Expr.Ternary): string {
    return this.parenthesize("?", node.condition, node.left, node.right);
  }

  private parenthesize(name: string, ...exprs: Array<Expr.Expr>): string {
    return `(${name} ${exprs.map((expr) => expr.accept(this)).join(" ")})`;
  }
}
