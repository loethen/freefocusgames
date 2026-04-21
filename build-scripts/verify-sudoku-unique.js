const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadTypeScriptModule(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    fileName: filePath
  });

  const module = { exports: {} };
  const localRequire = (specifier) => require(specifier);
  const runModule = new Function('require', 'module', 'exports', '__filename', '__dirname', outputText);
  runModule(localRequire, module, module.exports, filePath, path.dirname(filePath));
  return module.exports;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boardToString(board) {
  return board.map((row) => row.map((cell) => cell ?? '.').join('')).join('\n');
}

const sudokuPath = path.join(__dirname, '..', 'lib', 'sudoku.ts');
const { generatePuzzle, countSolutions } = loadTypeScriptModule(sudokuPath);

const difficultyArg = process.argv[2] ?? 'all';
const trials = parsePositiveInteger(process.argv[3], 10);
const difficulties = difficultyArg === 'all'
  ? ['easy', 'medium', 'hard', 'expert']
  : [difficultyArg];

let hasFailure = false;

for (const difficulty of difficulties) {
  let multiSolutionCount = 0;
  let sampleBoard = null;

  for (let trial = 0; trial < trials; trial++) {
    const { initialBoard } = generatePuzzle(difficulty);
    const solutionCount = countSolutions(initialBoard.map((row) => [...row]), 2);

    if (solutionCount !== 1) {
      multiSolutionCount++;
      sampleBoard ||= initialBoard;
    }
  }

  if (multiSolutionCount > 0) {
    hasFailure = true;
    console.error(`Found ${multiSolutionCount}/${trials} non-unique ${difficulty} puzzles.`);
    if (sampleBoard) {
      console.error(boardToString(sampleBoard));
    }
  } else {
    console.log(`Verified ${trials}/${trials} ${difficulty} puzzles had a unique solution.`);
  }
}

if (hasFailure) {
  process.exit(1);
}
