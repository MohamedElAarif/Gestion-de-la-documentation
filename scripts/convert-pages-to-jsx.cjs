const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const files = [
  "resources/js/pages/DocumentsList.tsx",
  "resources/js/pages/EmpruntsList.tsx",
  "resources/js/pages/MembreList.tsx",
  "resources/js/pages/welcome.tsx",
];

const options = {
  compilerOptions: {
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    esModuleInterop: true,
    removeComments: false,
    importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Preserve,
  },
};

files.forEach((relativePath) => {
  const absolutePath = path.resolve(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Skipping missing file: ${relativePath}`);
    return;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const { outputText } = ts.transpileModule(source, options);
  const newPath = absolutePath.replace(/\.tsx$/, ".jsx");
  fs.writeFileSync(newPath, outputText, "utf8");
  console.log(`Transpiled ${relativePath} -> ${path.relative(projectRoot, newPath)}`);
});
