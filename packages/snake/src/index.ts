import { Grid, Color } from "../packages/types/grid";
import { Point } from "../packages/types/point";
import { Snake } from "../packages/types/snake";
import { SnakeSolver } from "../packages/solver/SnakeSolver";

interface SnakeActionInputs {
  github_user_name: string;
  github_token: string;
  output_path: string;
  svg_width: number;
  svg_height: number;
  cell_size: number;
  cell_gap: number;
  cell_radius: number;
  snake_length: number;
  animation_duration: number;
  colors: string[];
}

interface ContributionData {
  date: string;
  count: number;
  level: number;
}

export class SnakeAction {
  private inputs: SnakeActionInputs;
  private grid: Grid;
  private contributionData: ContributionData[] = [];

  constructor(inputs: SnakeActionInputs) {
    this.inputs = inputs;
    this.grid = Grid.createEmpty(52, 7); // GitHub contribution grid is 52 weeks x 7 days
  }

  /**
   * Main execution function
   */
  async execute(): Promise<void> {
    console.log("🐍 Starting Snake GitHub Contribution Animation");

    try {
      // 1. Fetch contribution data
      await this.fetchContributionData();

      // 2. Populate grid with contribution data
      this.populateGrid();

      // 3. Generate snake path
      const snakePath = this.generateSnakePath();

      // 4. Create SVG animation
      const svg = this.createSVGAnimation(snakePath);

      // 5. Save SVG file
      await this.saveSVG(svg);

      console.log(`✅ Snake animation saved to ${this.inputs.output_path}`);
    } catch (error) {
      console.error("❌ Error generating snake animation:", error);
      throw error;
    }
  }

  /**
   * Fetch GitHub contribution data
   */
  private async fetchContributionData(): Promise<void> {
    console.log(`📊 Fetching contributions for ${this.inputs.github_user_name}`);

    const query = `
      query($userName: String!) {
        user(login: $userName) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.inputs.github_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { userName: this.inputs.github_user_name },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    // Extract contribution data
    const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
    this.contributionData = weeks.flatMap((week: any) =>
      week.contributionDays.map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: this.mapContributionLevel(day.contributionLevel),
      }))
    );

    console.log(`📈 Loaded ${this.contributionData.length} contribution days`);
  }

  /**
   * Map GitHub contribution levels to color levels
   */
  private mapContributionLevel(githubLevel: string): number {
    const levelMap: { [key: string]: number } = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };
    return levelMap[githubLevel] || 0;
  }

  /**
   * Populate grid with contribution data
   */
  private populateGrid(): void {
    console.log("🎨 Populating grid with contribution data");

    let dayIndex = 0;
    for (let week = 0; week < 52 && dayIndex < this.contributionData.length; week++) {
      for (let day = 0; day < 7 && dayIndex < this.contributionData.length; day++) {
        const contribution = this.contributionData[dayIndex];
        if (contribution.level > 0) {
          this.grid.setColor(week, day, contribution.level as Color);
        }
        dayIndex++;
      }
    }

    console.log("✅ Grid populated with contribution data");
  }

  /**
   * Generate snake path using the solver
   */
  private generateSnakePath(): Snake[] {
    console.log("🧠 Generating optimal snake path");

    // Create initial snake at top-left corner
    const startPoint = new Point(0, 0);
    const initialSnake = Snake.fromSinglePoint(startPoint, this.inputs.snake_length);

    // Solve the grid
    const solver = new SnakeSolver(this.grid);
    const path = solver.solve(initialSnake);

    console.log(`🎯 Generated path with ${path.length} moves`);
    return path;
  }

  /**
   * Create SVG animation from snake path
   */
  private createSVGAnimation(snakePath: Snake[]): string {
    console.log("🎬 Creating SVG animation");

    const { svg_width, svg_height, cell_size, cell_gap, cell_radius } = this.inputs;
    const colors = this.inputs.colors;

    let svg = `<svg width="${svg_width}" height="${svg_height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<style>
      .grid-cell { opacity: 0.3; }
      .snake-head { fill: #ff4444; }
      .snake-body { fill: #44ff44; }
      .eaten-cell { opacity: 0.1; }
    </style>`;

    // Add grid background
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        if (!this.grid.isEmptyCell(color)) {
          const cellX = x * (cell_size + cell_gap);
          const cellY = y * (cell_size + cell_gap);
          const colorHex = colors[color as number] || colors[0];

          svg += `<rect class="grid-cell" x="${cellX}" y="${cellY}" width="${cell_size}" height="${cell_size}" rx="${cell_radius}" fill="${colorHex}">`;

          // Animation to fade out when eaten
          const fadeTime = this.calculateFadeTime(snakePath, x, y);
          if (fadeTime >= 0) {
            svg += `<animate attributeName="opacity" begin="${fadeTime}s" dur="0.3s" from="0.3" to="0.1" fill="freeze"/>`;
          }

          svg += `</rect>`;
        }
      }
    }

    // Add snake animation
    this.addSnakeAnimation(svg, snakePath);

    svg += `</svg>`;
    return svg;
  }

  /**
   * Add snake animation to SVG
   */
  private addSnakeAnimation(svg: string, snakePath: Snake[]): void {
    const { cell_size, cell_gap, animation_duration } = this.inputs;
    const frameDuration = animation_duration / snakePath.length;

    // Snake head
    const headPath = snakePath.map((snake, index) => {
      const head = snake.getHead();
      const x = head.x * (cell_size + cell_gap) + cell_size / 2;
      const y = head.y * (cell_size + cell_gap) + cell_size / 2;
      const time = index * frameDuration;
      return `${x},${y};${time}`;
    }).join(';');

    svg += `<circle class="snake-head" r="${cell_size / 3}">`;
    svg += `<animateMotion dur="${animation_duration}s" repeatCount="indefinite">`;
    svg += `<mpath xlinkHref="#snakePath"/>`;
    svg += `</animateMotion>`;
    svg += `</circle>`;

    // Snake body segments
    for (let segmentIndex = 1; segmentIndex < this.inputs.snake_length; segmentIndex++) {
      const segmentPath = snakePath.map((snake, index) => {
        if (index + segmentIndex < snakePath.length) {
          const segment = snake.getSegment(Math.min(segmentIndex, snake.getLength() - 1));
          const x = segment.x * (cell_size + cell_gap) + cell_size / 2;
          const y = segment.y * (cell_size + cell_gap) + cell_size / 2;
          return `${x},${y}`;
        }
        return null;
      }).filter(Boolean).join(' ');

      svg += `<circle class="snake-body" r="${cell_size / 4}">`;
      svg += `<animateMotion dur="${animation_duration}s" begin="${segmentIndex * frameDuration}s" repeatCount="indefinite">`;
      svg += `<values>${segmentPath}</values>`;
      svg += `</animateMotion>`;
      svg += `</circle>`;
    }
  }

  /**
   * Calculate when a cell should fade out
   */
  private calculateFadeTime(snakePath: Snake[], cellX: number, cellY: number): number {
    const { animation_duration } = this.inputs;
    const frameDuration = animation_duration / snakePath.length;

    for (let i = 0; i < snakePath.length; i++) {
      const head = snakePath[i].getHead();
      if (head.x === cellX && head.y === cellY) {
        return i * frameDuration;
      }
    }

    return -1; // Cell is never eaten
  }

  /**
   * Save SVG to file
   */
  private async saveSVG(svgContent: string): Promise<void> {
    await Bun.write(this.inputs.output_path, svgContent);
  }
}

/**
 * Main entry point for the action
 */
export async function run(): Promise<void> {
  const inputs: SnakeActionInputs = {
    github_user_name: process.env.INPUT_GITHUB_USER_NAME || '',
    github_token: process.env.INPUT_GITHUB_TOKEN || '',
    output_path: process.env.INPUT_OUTPUT_PATH || 'snake.svg',
    svg_width: parseInt(process.env.INPUT_SVG_WIDTH || '800'),
    svg_height: parseInt(process.env.INPUT_SVG_HEIGHT || '200'),
    cell_size: parseInt(process.env.INPUT_CELL_SIZE || '12'),
    cell_gap: parseInt(process.env.INPUT_CELL_GAP || '2'),
    cell_radius: parseInt(process.env.INPUT_CELL_RADIUS || '2'),
    snake_length: parseInt(process.env.INPUT_SNAKE_LENGTH || '6'),
    animation_duration: parseInt(process.env.INPUT_ANIMATION_DURATION || '20'),
    colors: (process.env.INPUT_COLORS || '#161b22,#0e4429,#006d32,#26a641,#39d353').split(','),
  };

  const action = new SnakeAction(inputs);
  await action.execute();
}

// Run if this is the main module
if (import.meta.main) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}