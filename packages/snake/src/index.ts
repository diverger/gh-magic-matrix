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
    const outputsInput = core.getMultilineInput("outputs");
    const outputs = parseOutputsOption(
      outputsInput && outputsInput.length > 0
        ? outputsInput
        : [core.getInput("gif_out_path"), core.getInput("svg_out_path")].filter(Boolean),
    );
    const githubToken =
      core.getInput("github_token") || process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

    // Parse contribution counter configuration
    const showContributionCounter = process.env.INPUT_SHOW_CONTRIBUTION_COUNTER === "true";
    const hideProgressBar = process.env.INPUT_HIDE_PROGRESS_BAR === "true";

    // Parse multiple displays configuration
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
      if (counterDisplays && counterDisplays.length > 0) {
        console.log(`📊 Contribution counter enabled with ${counterDisplays.length} display(s)`);

        // Note: contributionMap will be built in generate-contribution-snake.ts
        outputs.forEach(output => {
          if (output) {
            output.animationOptions.contributionCounter = {
              enabled: true,
              displays: counterDisplays,
              progressBarMode: 'contribution', // Use contribution-based progress bar with gradient
              hideProgressBar, // Apply hide setting
            };
          }
        });
      } else {
        // Counter enabled but no displays - still enable contribution mode for progress bar
        console.log(`📊 Contribution counter enabled (no displays, progress bar only)`);

        outputs.forEach(output => {
          if (output) {
            output.animationOptions.contributionCounter = {
              enabled: true,
              progressBarMode: 'contribution', // Use contribution-based progress bar with gradient
              hideProgressBar, // Apply hide setting
            };
          }
        });
      }
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