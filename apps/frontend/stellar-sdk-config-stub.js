/**
 * Stub for @stellar/stellar-sdk lib/minimal/bindings/config.js
 * The original requires '../../package.json' which breaks in webpack (path doesn't exist in bundle).
 * We only need ConfigGenerator and the version for generated package.json — use fixed version.
 */
"use strict";

const SDK_VERSION = "14.5.0";

function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}

function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1;
    o.configurable = !0;
    if ("value" in o) o.writable = !0;
    Object.defineProperty(e, o.key, o);
  }
}

function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), e;
}

var ConfigGenerator = (function () {
  function ConfigGenerator() {
    _classCallCheck(this, ConfigGenerator);
  }
  return _createClass(ConfigGenerator, [
    {
      key: "generate",
      value: function generate(options) {
        var contractName = options.contractName;
        return {
          packageJson: this.generatePackageJson(contractName),
          tsConfig: this.generateTsConfig(),
          gitignore: this.generateGitignore(),
          readme: this.generateReadme(contractName),
        };
      },
    },
    {
      key: "generatePackageJson",
      value: function generatePackageJson(contractName) {
        var generatedPackageJson = {
          name: contractName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          version: "0.0.1",
          description:
            "Generated TypeScript bindings for ".concat(
              contractName,
              " Stellar contract"
            ),
          type: "module",
          main: "dist/index.js",
          types: "dist/index.d.ts",
          scripts: { build: "tsc" },
          dependencies: {
            "@stellar/stellar-sdk": "^".concat(SDK_VERSION),
            buffer: "6.0.3",
          },
          devDependencies: { typescript: "^5.6.3" },
        };
        return JSON.stringify(generatedPackageJson, null, 2);
      },
    },
    {
      key: "generateTsConfig",
      value: function generateTsConfig() {
        var tsConfig = {
          compilerOptions: {
            target: "ESNext",
            module: "NodeNext",
            moduleResolution: "nodenext",
            declaration: true,
            outDir: "./dist",
            strictNullChecks: true,
            skipLibCheck: true,
          },
          include: ["src/*"],
        };
        return JSON.stringify(tsConfig, null, 2);
      },
    },
    {
      key: "generateGitignore",
      value: function generateGitignore() {
        return [
          "# Dependencies",
          "node_modules/",
          "",
          "# Build outputs",
          "dist/",
          "*.tgz",
          "",
          "# IDE",
          ".vscode/",
          ".idea/",
          "",
          "# OS",
          ".DS_Store",
          "Thumbs.db",
          "",
          "# Logs",
          "*.log",
          "npm-debug.log*",
          "",
          "# Runtime data",
          "*.pid",
          "*.seed",
        ].join("\n");
      },
    },
    {
      key: "generateReadme",
      value: function generateReadme(contractName) {
        return [
          "# ".concat(contractName, " Contract Bindings"),
          "",
          "TypeScript bindings for the ".concat(
            contractName,
            " Stellar smart contract."
          ),
          "",
          "## Installation",
          "",
          "```bash",
          "npm install",
          "```",
          "",
          "## Build",
          "",
          "```bash",
          "npm run build",
          "```",
          "",
          "## Usage",
          "",
          "```typescript",
          'import { Client } from "./src";',
          "",
          "const client = new Client({",
          '  contractId: "YOUR_CONTRACT_ID",',
          '  rpcUrl: "https://soroban-testnet.stellar.org:443",',
          '  networkPassphrase: "Test SDF Network ; September 2015",',
          "});",
          "",
          "// Call contract methods",
          "// const result = await client.methodName();",
          "```",
          "",
          "## Generated Files",
          "",
          "- `src/index.ts` - Entry point exporting the Client",
          "- `src/types.ts` - Type definitions for contract structs, enums, and unions",
          "- `src/contract.ts` - Client implementation",
          "- `tsconfig.json` - TypeScript configuration",
          "- `package.json` - NPM package configuration",
          "",
          "This package was generated using the Js-Stellar-SDK contract binding generator.",
        ].join("\n");
      },
    },
  ]);
})();

exports.ConfigGenerator = ConfigGenerator;
