export type Board = (number | null)[][];
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

const BLANK = null;

type CellChoice = {
  row: number;
  col: number;
  candidates: number[];
};

// Validates if placing num at board[row][col] is valid
export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check col
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
}

function getCandidates(board: Board, row: number, col: number): number[] {
  const candidates: number[] = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
}

function shuffleNumbers(numbers: number[]): number[] {
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function getTargetHoles(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 30
    : difficulty === 'medium' ? 40
      : difficulty === 'hard' ? 50
        : 55;
}

function findBestEmptyCell(board: Board, randomizeCandidates = false): CellChoice | null {
  let bestCell: CellChoice | null = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== BLANK) continue;

      const candidates = getCandidates(board, row, col);
      const choice = {
        row,
        col,
        candidates: randomizeCandidates ? shuffleNumbers([...candidates]) : candidates
      };

      if (choice.candidates.length === 0) return choice;
      if (!bestCell || choice.candidates.length < bestCell.candidates.length) {
        bestCell = choice;
        if (bestCell.candidates.length === 1) return bestCell;
      }
    }
  }

  return bestCell;
}

// Solves the board using backtracking. Returns true if solvable.
export function solveSudoku(board: Board, randomizeCandidates = false): boolean {
  const nextCell = findBestEmptyCell(board, randomizeCandidates);
  if (!nextCell) return true;
  if (nextCell.candidates.length === 0) return false;

  for (const num of nextCell.candidates) {
    board[nextCell.row][nextCell.col] = num;
    if (solveSudoku(board, randomizeCandidates)) return true;
    board[nextCell.row][nextCell.col] = BLANK;
  }

  return false;
}

export function countSolutions(board: Board, limit = 2): number {
  const nextCell = findBestEmptyCell(board);
  if (!nextCell) return 1;
  if (nextCell.candidates.length === 0) return 0;

  let solutionCount = 0;
  for (const num of nextCell.candidates) {
    board[nextCell.row][nextCell.col] = num;
    solutionCount += countSolutions(board, limit - solutionCount);
    board[nextCell.row][nextCell.col] = BLANK;

    if (solutionCount >= limit) {
      return solutionCount;
    }
  }

  return solutionCount;
}

// Generates a fully solved valid 9x9 board
export function generateSolvedBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(BLANK));

  // Fill diagonal 3x3 boxes first (independent of each other) to speed up solving
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(board, i, i);
  }

  // Solve the rest
  solveSudoku(board, true);
  return board;
}

function fillBox(board: Board, row: number, col: number) {
  let num: number;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
}

function isSafeInBox(board: Board, row: number, col: number, num: number) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[row + i][col + j] === num) return false;
    }
  }
  return true;
}

// Removes numbers to create a puzzle
export function generatePuzzle(difficulty: Difficulty): { initialBoard: Board, solvedBoard: Board } {
  const targetHoles = getTargetHoles(difficulty);
  const maxGenerationAttempts = 6;

  let bestPuzzle: Board | null = null;
  let bestSolvedBoard: Board | null = null;
  let bestHoleCount = -1;

  for (let generationAttempt = 0; generationAttempt < maxGenerationAttempts; generationAttempt++) {
    const solvedBoard = generateSolvedBoard();
    const puzzleBoard = cloneBoard(solvedBoard);
    const cells = shuffleNumbers(Array.from({ length: 81 }, (_, index) => index));

    let removedCells = 0;

    for (const cellIndex of cells) {
      const row = Math.floor(cellIndex / 9);
      const col = cellIndex % 9;
      const currentValue = puzzleBoard[row][col];

      if (currentValue === BLANK) continue;

      puzzleBoard[row][col] = BLANK;

      if (countSolutions(puzzleBoard, 2) !== 1) {
        puzzleBoard[row][col] = currentValue;
        continue;
      }

      removedCells++;

      if (removedCells >= targetHoles) {
        return { initialBoard: puzzleBoard, solvedBoard };
      }
    }

    if (removedCells > bestHoleCount) {
      bestHoleCount = removedCells;
      bestPuzzle = cloneBoard(puzzleBoard);
      bestSolvedBoard = solvedBoard;
    }
  }

  if (!bestPuzzle || !bestSolvedBoard) {
    throw new Error('Failed to generate a unique sudoku puzzle.');
  }

  return { initialBoard: bestPuzzle, solvedBoard: bestSolvedBoard };
}
