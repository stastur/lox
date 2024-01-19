import { AstPrinter } from "./ast-printer";
import { Scanner } from "./scanner";
import fs from "node:fs";
import { Token, TokenType } from "./token";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Environment } from "./environment";
import { Expression } from "./stmt";

function main() {
  if (process.argv.length > 3) {
    console.log("Usage: tslox [script]");
    process.exit(64);
  } else if (process.argv.length === 3) {
    runFile(process.argv[2]);
  } else {
    console.log(">Lox REPL");
    runPrompt();
  }
}

main();

function runFile(path: string) {
  const bytes = fs.readFileSync(path);
  const source = new TextDecoder().decode(bytes);

  const interpreter = new Interpreter();
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  const parser = new Parser(tokens);
  const statements = parser.parse();

  interpreter.interpret(statements);
}

function runPrompt() {
  const stdin = process.openStdin();
  const interpreter = new Interpreter();

  stdin.addListener("data", (data) => {
    const scanner = new Scanner(data.toString());
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);

    const [statement] = parser.parse();

    if (statement instanceof Expression) {
      const value = interpreter.evaluate(statement.expression);
      console.log(interpreter.stringify(value));
    } else {
      interpreter.interpret([statement]);
    }
  });
}

function error(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, " at end", message);
  } else {
    report(token.line, ` at '${token.lexeme}'`, message);
  }
}

function report(line: number, where: string, message: string) {
  console.error(`[line ${line}] Error${where}: ${message}`);
}
