module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    /** Jest: Vite's import.meta.env is not valid in the VM; use process.env + default. */
    function babelPluginImportMetaEnvVite({ types: t }) {
      return {
        visitor: {
          MemberExpression(path) {
            const { node } = path;
            if (!t.isIdentifier(node.property, { name: "VITE_API_URL" })) return;
            if (!t.isMemberExpression(node.object)) return;
            const inner = node.object;
            if (!t.isIdentifier(inner.property, { name: "env" })) return;
            if (!t.isMetaProperty(inner.object)) return;
            const meta = inner.object;
            if (meta.meta.name !== "import" || meta.property.name !== "meta") return;

            path.replaceWith(
              t.logicalExpression(
                "||",
                t.memberExpression(
                  t.memberExpression(
                    t.identifier("process"),
                    t.identifier("env"),
                  ),
                  t.identifier("VITE_API_URL"),
                ),
                t.stringLiteral("http://localhost:5001"),
              ),
            );
          },
        },
      };
    },
    ["babel-plugin-transform-import-meta", { module: "ES6" }],
  ],
};
