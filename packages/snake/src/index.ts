import { Grid, Color } from "../packages/types/grid";
import { Point } from "../packages/types/point";
import { Snake } from "../packages/types/snake";
import { SnakeSolver } from "../packages/solver/snake-solver";
import { createSvg } from "../packages/svg-creator/svg-builder";

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
  frame_duration: number; // Duration per frame in milliseconds (like SNK)
  colors: string[];
  // Contribution counter options
  show_contribution_counter?: boolean;
  counter_prefix?: string;
  counter_suffix?: string;
  counter_font_size?: number;
  counter_color?: string;
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

    const user = data?.data?.user;
    if (!user) {
      throw new Error(`GitHub user not found or inaccessible: ${this.inputs.github_user_name}`);
    }

    // Extract contribution data
    const weeks = user.contributionsCollection.contributionCalendar.weeks ?? [];

    if (weeks.length === 0) {
      console.warn(`⚠️ No contribution weeks found for user ${this.inputs.github_user_name}. The user may have no public contributions or the token may lack required scopes.`);
    }

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
        const lvl = contribution.level;
        if (lvl > 0 && lvl <= 9) {
          this.grid.setColor(week, day, lvl as Color);
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

    // Create initial snake outside the grid (like SNK's snake4)
    const initialSnake = Snake.createHorizontal(this.inputs.snake_length);

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

    // Build color dots mapping (contribution level -> color hex)
    const colorDots: Record<number, string> = {};
    for (let i = 0; i < this.inputs.colors.length; i++) {
      colorDots[i] = this.inputs.colors[i];
    }

    // Build contribution count map (color level -> total contribution count)
    const contributionMap = new Map<number, number>();
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        if (!this.grid.isEmptyCell(color)) {
          // Find the contribution data for this cell
          const index = y * this.grid.width + x;
          if (index < this.contributionData.length) {
            const contrib = this.contributionData[index];
            const currentCount = contributionMap.get(color as number) || 0;
            contributionMap.set(color as number, currentCount + contrib.count);
          }
        }
      }
    }

    // Prepare drawing options matching svg-builder interface
    const drawOptions = {
      colorDots,
      colorEmpty: "#ebedf0",
      colorDotBorder: "rgba(0,0,0,0.06)",
      colorSnake: "#44ff44",
      sizeDot: this.inputs.cell_size,
      sizeDotBorderRadius: this.inputs.cell_radius,
      sizeCell: this.inputs.cell_size + this.inputs.cell_gap,
    };

    const animationOptions = {
      frameDuration: this.inputs.frame_duration, // in milliseconds
      contributionCounter: this.inputs.show_contribution_counter ? {
        enabled: true,
        prefix: this.inputs.counter_prefix,
        suffix: this.inputs.counter_suffix,
        fontSize: this.inputs.counter_font_size,
        color: this.inputs.counter_color,
        contributionMap,
      } : undefined,
    };

    // Collect all non-empty cells
    const cells: Point[] = [];
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const color = this.grid.getColor(x, y);
        if (!this.grid.isEmptyCell(color)) {
          cells.push(new Point(x, y));
        }
      }
    }

    // Delegate to existing svg-builder
    return createSvg(this.grid, cells, snakePath, drawOptions, animationOptions);
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
    // SNK logic: use frame_duration (milliseconds) instead of total animation_duration
    frame_duration: parseFloat(process.env.INPUT_FRAME_DURATION || '100'), // Default 100ms
    colors: (process.env.INPUT_COLORS || '#161b22,#0e4429,#006d32,#26a641,#39d353').split(','),
    // Contribution counter options
    show_contribution_counter: process.env.INPUT_SHOW_CONTRIBUTION_COUNTER === 'true',
    counter_prefix: process.env.INPUT_COUNTER_PREFIX || '🎯 ',
    counter_suffix: process.env.INPUT_COUNTER_SUFFIX || ' contributions',
    counter_font_size: parseInt(process.env.INPUT_COUNTER_FONT_SIZE || '14'),
    counter_color: process.env.INPUT_COUNTER_COLOR || '#666',
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