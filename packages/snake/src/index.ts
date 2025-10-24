/**
 * GitHub Action Entry Point
 *
 * Main entry point for the GitHub Action that generates snake contribution animations.
 * Handles input parsing, file generation, and output writing with comprehensive error handling.
 *
 * @module action
 */

import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import { parseOutputsOption } from "./outputs-options";
import { generateContributionSnake } from "./generate-contribution-snake";

/**
 * Main action execution function.
 *
 * Orchestrates the entire snake generation process from input parsing to file output.
 * Handles errors gracefully and provides detailed logging for debugging.
 */
const runAction = async (): Promise<void> => {
  try {
    // Parse GitHub Action inputs
    const userName = core.getInput("github_user_name");
    const outputs = parseOutputsOption(
      core.getMultilineInput("outputs") ?? [
        core.getInput("gif_out_path"),
        core.getInput("svg_out_path"),
      ],
    );
    const githubToken =
      core.getInput("github_token") || process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

    // Parse contribution counter options from environment variables
    const showContributionCounter = process.env.INPUT_SHOW_CONTRIBUTION_COUNTER === "true";
    const counterPrefix = process.env.INPUT_COUNTER_PREFIX || "";
    const counterSuffix = process.env.INPUT_COUNTER_SUFFIX || "";
    const counterFontSize = process.env.INPUT_COUNTER_FONT_SIZE ? parseInt(process.env.INPUT_COUNTER_FONT_SIZE) : undefined;
    const counterColor = process.env.INPUT_COUNTER_COLOR || "#666";
    const counterPosition = (process.env.INPUT_COUNTER_POSITION || 'follow') as 'top-left' | 'top-right' | 'follow';
    
    // Parse multiple displays configuration (if provided)
    let counterDisplays: any[] | undefined;
    if (process.env.INPUT_COUNTER_DISPLAYS) {
      try {
        counterDisplays = JSON.parse(process.env.INPUT_COUNTER_DISPLAYS);
      } catch (e) {
        console.warn(`⚠️  Failed to parse INPUT_COUNTER_DISPLAYS: ${e}`);
      }
    }

    if (!userName) {
      throw new Error("github_user_name input is required");
    }

    if (!githubToken) {
      throw new Error("github_token input is required");
    }

    console.log(`🐍 Starting snake generation for user: ${userName}`);
    console.log(`📝 Processing ${outputs.length} output(s)`);

    // Add contribution counter configuration to all outputs if enabled
    if (showContributionCounter) {
      if (counterDisplays) {
        console.log(`📊 Contribution counter enabled with ${counterDisplays.length} display(s)`);
      } else {
        console.log(`📊 Contribution counter enabled: ${counterPrefix}X${counterSuffix} (position: ${counterPosition})`);
      }
      
      // Note: contributionMap will be built in generate-contribution-snake.ts
      outputs.forEach(output => {
        if (output) {
          output.animationOptions.contributionCounter = {
            enabled: true,
            displays: counterDisplays,
            // Legacy single counter config (for backward compatibility)
            prefix: counterPrefix,
            suffix: counterSuffix,
            fontSize: counterFontSize,
            color: counterColor,
            position: counterPosition,
          };
        }
      });
    }

    const results = await generateContributionSnake(userName, outputs, {
      githubToken,
    });

    // Write results to specified output files
    outputs.forEach((out, i) => {
      const result = results[i];
      if (out?.filename && result) {
        console.log(`💾 Writing to ${out.filename}`);
        fs.mkdirSync(path.dirname(out.filename), { recursive: true });
        fs.writeFileSync(out.filename, result);
      }
    });

    console.log("✅ Snake generation completed successfully");
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error occurred";
    console.error(`❌ Action failed: ${errorMessage}`);
    core.setFailed(`Action failed with "${errorMessage}"`);
  }
};

// Execute the action
runAction();