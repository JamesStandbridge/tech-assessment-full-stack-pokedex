/**
 * Layer rules of ADR 9: api, domain, ui, features and app, imported only inwards.
 * @type {import("dependency-cruiser").IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "api-is-innermost",
      comment: "The api layer depends on nothing else in src.",
      severity: "error",
      from: { path: "^src/api/" },
      to: { path: "^src/(domain|ui|features|app)/" },
    },
    {
      name: "domain-is-pure",
      comment: "The domain layer only reads contract types from api.",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { path: "^src/(ui|features|app)/|^src/api/(client|http)" },
    },
    {
      name: "domain-has-no-packages",
      comment: "The domain layer is plain TypeScript, without React or any package.",
      severity: "error",
      from: { path: "^src/domain/", pathNot: "\\.test\\.ts$" },
      to: { dependencyTypes: ["npm", "npm-dev"] },
    },
    {
      name: "ui-knows-no-pokedex",
      comment: "Visual primitives know nothing of the Pokédex.",
      severity: "error",
      from: { path: "^src/ui/" },
      to: { path: "^src/(api|domain|features|app)/" },
    },
    {
      name: "features-use-ports",
      comment: "Features depend on ports, never on the concrete client or the app.",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/app/|^src/api/(client|http)" },
    },
    {
      name: "no-test-code-in-production",
      severity: "error",
      from: { path: "^src/", pathNot: "\\.test\\.tsx?$|^src/test/" },
      to: { path: "\\.test\\.tsx?$|^src/test/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require"] },
  },
};
