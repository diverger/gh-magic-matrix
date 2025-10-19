import { Grid, Color, EMPTY } from "../packages/types/grid";
import { Point } from "../packages/types/point";
import { Snake } from "../packages/types/snake";
import { SnakeSolver } from "../packages/solver/snake-solver";

// Simple test to validate the snake solver implementation
function testSnakeSolver(): void {
  console.log("🧪 Testing Snake Solver Implementation");

  // Create a small test grid
  const grid = new Grid(5, 5);

  // Add some test colors
  grid.setColor(1, 1, 1 as Color);
  grid.setColor(2, 2, 2 as Color);
  grid.setColor(3, 3, 3 as Color);
  grid.setColor(4, 4, 1 as Color);

  console.log("📊 Test grid created with sample colors");

  // Create initial snake
  const startPoint = new Point(0, 0);
  const initialSnake = Snake.fromSinglePoint(startPoint, 3);

  console.log(`🐍 Initial snake created at (${startPoint.x}, ${startPoint.y}) with length ${initialSnake.getLength()}`);

  // Test basic snake operations
  console.log("Testing snake operations:");
  console.log(`- Head position: (${initialSnake.getHeadX()}, ${initialSnake.getHeadY()})`);
  console.log(`- Snake length: ${initialSnake.getLength()}`);

  // Test movement
  const movedSnake = initialSnake.nextSnake(1, 0);
  console.log(`- After moving right: (${movedSnake.getHeadX()}, ${movedSnake.getHeadY()})`);

  // Test collision detection
  const willCollide = initialSnake.willSelfCollide(-1, 0);
  console.log(`- Will collide when moving left: ${willCollide}`);

  // Test solver
  try {
    const solver = new SnakeSolver(grid);
    console.log("✅ SnakeSolver created successfully");

    const solution = solver.solve(initialSnake);
    console.log(`🎯 Solution found with ${solution.length} moves`);

    if (solution.length > 0) {
      const finalSnake = solution[solution.length - 1];
      console.log(`📍 Final position: (${finalSnake.getHeadX()}, ${finalSnake.getHeadY()})`);
    }

  } catch (error) {
    console.error("❌ Error testing solver:", error);
  }

  console.log("✅ Basic tests completed successfully!");
}

// Run tests if this is the main module
if (import.meta.main) {
  testSnakeSolver();
}