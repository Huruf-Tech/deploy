import { containsCoreSegment, isRelative } from "./utils.ts";

const plugin: Deno.lint.Plugin = {
  name: "no-relative-core-imports",
  rules: {
    "no-relative-core-imports": {
      create(context) {
        const TARGET = "core";
        const ALIAS = "@/core/";

        function report(
          _node:
            | Deno.lint.ImportDeclaration
            | Deno.lint.ExportNamedDeclaration
            | Deno.lint.ExportAllDeclaration,
          source: Deno.lint.StringLiteral,
        ) {
          const spec = source.value;

          context.report({
            node: source,
            message:
              `Relative import into "${TARGET}/" is forbidden. Use "${ALIAS}..." instead.`,
            fix(fixer) {
              const match = spec.match(
                /^(?:\.{1,2}\/)+core\/(.+)$|^\.\/*core\/(.+)$/,
              );

              const rest = match?.[1] ?? match?.[2];

              if (!rest) return [];

              const quote = context.sourceCode
                  .getText(source)
                  .startsWith("'")
                ? "'"
                : '"';

              return fixer.replaceTextRange(
                source.range,
                `${quote}${ALIAS}${rest}${quote}`,
              );
            },
          });
        }

        return {
          ImportDeclaration(node) {
            const source = node.source;
            if (
              source &&
              typeof source.value === "string" &&
              isRelative(source.value) &&
              containsCoreSegment(source.value, TARGET)
            ) {
              report(node, source);
            }
          },
          ExportNamedDeclaration(node) {
            const source = node.source;
            if (
              source &&
              typeof source.value === "string" &&
              isRelative(source.value) &&
              containsCoreSegment(source.value, TARGET)
            ) {
              report(node, source);
            }
          },
          ExportAllDeclaration(node) {
            const source = node.source;
            if (
              source &&
              typeof source.value === "string" &&
              isRelative(source.value) &&
              containsCoreSegment(source.value, TARGET)
            ) {
              report(node, source);
            }
          },
        };
      },
    },
  },
};

export default plugin;
