import { Token, TokenType } from "./token";
import * as Expr from "./expr";
import * as Stmt from "./stmt";

export class Parser {
  current = 0;
  loopDepth = 0;

  constructor(public tokens: Token[]) {}

  parse() {
    const statements: Array<Stmt.Stmt> = [];

    while (!this.isAtEnd()) {
      const decl = this.declaration();
      decl && statements.push(decl);
    }

    return statements;
  }

  declaration(): Stmt.Stmt | null {
    try {
      if (this.match(TokenType.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  statement(): Stmt.Stmt {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.BREAK)) return this.breakStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new Stmt.Block(this.block());
    return this.expressionStatement();
  }

  breakStatement(): Stmt.Stmt {
    if (this.loopDepth === 0) {
      this.error(this.previous(), "Break outside of loop.");
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after break.");
    return new Stmt.Break();
  }

  forStatement(): Stmt.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt.Stmt | undefined;

    if (this.match(TokenType.SEMICOLON)) {
      initializer = undefined;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    const condition = this.check(TokenType.SEMICOLON)
      ? undefined
      : this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

    const increment = this.check(TokenType.RIGHT_PAREN)
      ? undefined
      : this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

    this.loopDepth++;
    let body = this.statement();
    this.loopDepth--;

    if (increment) {
      body = new Stmt.Block([body, new Stmt.Expression(increment)]);
    }

    body = new Stmt.While(condition ?? new Expr.Literal(true), body);

    if (initializer) {
      body = new Stmt.Block([initializer, body]);
    }

    return body;
  }

  whileStatement(): Stmt.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");

    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");

    this.loopDepth++;
    const body = this.statement();
    this.loopDepth--;

    return new Stmt.While(condition, body);
  }

  ifStatement(): Stmt.Stmt {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match(TokenType.ELSE)
      ? this.statement()
      : undefined;

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  printStatement(): Stmt.Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  varDeclaration(): Stmt.Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    const initializer = this.match(TokenType.EQUAL)
      ? this.expression()
      : undefined;
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

    return new Stmt.Var(name!, initializer!);
  }

  expressionStatement(): Stmt.Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new Stmt.Expression(expr);
  }

  makeBinary =
    (operation: () => Expr.Expr, ...types: TokenType[]) =>
    () => {
      let expr = operation();

      while (this.match(...types)) {
        expr = new Expr.Binary(expr, this.previous(), operation());
      }

      return expr;
    };

  primary() {
    if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenType.NIL)) return new Expr.Literal(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new Expr.Variable(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  unary(): Expr.Expr {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      return new Expr.Unary(this.previous(), this.unary());
    }

    return this.primary();
  }

  or() {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  and() {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  factor = this.makeBinary(
    this.unary.bind(this),
    TokenType.SLASH,
    TokenType.STAR,
  );

  term = this.makeBinary(
    this.factor.bind(this),
    TokenType.MINUS,
    TokenType.PLUS,
  );

  comparison = this.makeBinary(
    this.term.bind(this),
    TokenType.GREATER,
    TokenType.GREATER_EQUAL,
    TokenType.LESS,
    TokenType.LESS_EQUAL,
  );

  equality = this.makeBinary(
    this.comparison.bind(this),
    TokenType.BANG_EQUAL,
    TokenType.EQUAL_EQUAL,
  );

  ternary(): Expr.Expr {
    let expr = this.or();

    if (this.match(TokenType.QUESTION)) {
      const left = this.or();
      this.consume(TokenType.COLON, "Expect ':' after then branch.");
      const right = this.or();

      expr = new Expr.Ternary(expr, left, right);
    }

    return expr;
  }

  sequence = this.makeBinary(this.ternary.bind(this), TokenType.COMMA);

  expression(): Expr.Expr {
    return this.assignment();
  }

  assignment(): Expr.Expr {
    const expr = this.sequence();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name = expr.name;
        return new Expr.Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  block(): Array<Stmt.Stmt> {
    const statements: Array<Stmt.Stmt> = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const decl = this.declaration();
      decl && statements.push(decl);
    }

    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();
    this.error(this.peek(), message);
  }

  error(token: Token, message: string) {
    console.error(token, message);
    throw new Error(message);
  }

  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  peek(): Token {
    return this.tokens[this.current];
  }

  previous(): Token {
    return this.tokens[this.current - 1];
  }
}
