import fs from "node:fs";
import path from "node:path";

function nodeTemplate(
  base: string,
  name: string,
  params: ReadonlyArray<Readonly<[name: string, type: string]>>,
) {
  const paramsString = params
    .map(([name, type]) => `public ${name}: ${type}`)
    .join();

  return `\
export class ${name} implements ${base} {
  constructor(${paramsString}){}
  
  accept<T>(visitor: Visitor<T>) {
    return visitor.visit${name}${base}(this);
  }
}
`;
}

function generateExprAst(outputDir: string) {
  const outputPath = path.join(outputDir, "expr.ts");
  const output = fs.createWriteStream(outputPath);

  const nodesToGenerate = [
    [
      "Ternary",
      [
        ["condition", "Expr"],
        ["left", "Expr"],
        ["right", "Expr"],
      ],
    ],
    [
      "Binary",
      [
        ["left", "Expr"],
        ["operator", "Token"],
        ["right", "Expr"],
      ],
    ],
    ["Grouping", [["expression", "Expr"]]],
    ["Literal", [["value", "LiteralValue"]]],
    [
      "Logical",
      [
        ["left", "Expr"],
        ["operator", "Token"],
        ["right", "Expr"],
      ],
    ],
    [
      "Unary",
      [
        ["operator", "Token"],
        ["right", "Expr"],
      ],
    ],
    ["Variable", [["name", "Token"]]],
    [
      "Assign",
      [
        ["name", "Token"],
        ["value", "Expr"],
      ],
    ],
  ] as const;

  output.write(`\
// generated by generate-ast.ts
import { Token, LiteralValue } from "./token";

export interface Expr {
  accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
${nodesToGenerate
  .map(([name]) => `  visit${name}Expr(node: ${name}): T;`)
  .join("\n")}
}

${nodesToGenerate
  .map(([name, params]) => nodeTemplate("Expr", name, params))
  .join("\n")}
`);
}

function generateStmtAst(outputDir: string) {
  const outputPath = path.join(outputDir, "stmt.ts");
  const output = fs.createWriteStream(outputPath);

  const nodesToGenerate = [
    ["Block", [["statements", "Stmt[]"]]],
    ["Expression", [["expression", "Expr"]]],
    [
      "If",
      [
        ["condition", "Expr"],
        ["thenBranch", "Stmt"],
        ["elseBranch", "Stmt | undefined"],
      ],
    ],
    ["Print", [["expression", "Expr"]]],
    [
      "Var",
      [
        ["name", "Token"],
        ["initializer", "Expr"],
      ],
    ],
    [
      "While",
      [
        ["condition", "Expr"],
        ["body", "Stmt"],
      ],
    ],
    ["Break", []],
  ] as const;

  output.write(`\
// generated by generate-ast.ts
import { Token } from "./token";
import { Expr } from "./expr";

export interface Stmt {
  accept<T>(visitor: Visitor<T>): T;
}

export interface Visitor<T> {
${nodesToGenerate
  .map(([name]) => `  visit${name}Stmt(node: ${name}): T;`)
  .join("\n")}
}

${nodesToGenerate
  .map(([name, params]) => nodeTemplate("Stmt", name, params))
  .join("\n")}
`);
}

generateExprAst("src");
generateStmtAst("src");
