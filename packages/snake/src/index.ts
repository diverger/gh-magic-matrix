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
import { parseOutputsOption, type SvgDrawOptions } from "./outputs-options";
import { generateContributionSnake } from "./generate-contribution-snake";
import type { CounterDisplayConfig } from "../packages/svg-creator/svg-stack-renderer";

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
    const forceAnimations = process.env.INPUT_FORCE_ANIMATIONS !== "false";
    const counterDebug = process.env.INPUT_COUNTER_DEBUG === "true";

    // Parse custom snake configuration (emoji/letters/images)
    const useCustomSnake = process.env.INPUT_USE_CUSTOM_SNAKE === "true";
    let customSnakeConfig: SvgDrawOptions['customSnakeConfig'] | undefined;
    if (process.env.INPUT_CUSTOM_SNAKE_CONFIG) {
      try {
        customSnakeConfig = JSON.parse(process.env.INPUT_CUSTOM_SNAKE_CONFIG);
      } catch (e) {
        throw new Error(`Failed to parse INPUT_CUSTOM_SNAKE_CONFIG: ${(e as Error).message || String(e)}`);
      }
    }

    // Parse multiple displays configuration
    let counterDisplays: CounterDisplayConfig[] | undefined;
    if (process.env.INPUT_COUNTER_DISPLAYS) {
      try {
        counterDisplays = JSON.parse(process.env.INPUT_COUNTER_DISPLAYS);
      } catch (e) {
        throw new Error(`Failed to parse INPUT_COUNTER_DISPLAYS: ${(e as Error).message || String(e)}`);
      }
    }

    if (!userName) {
      throw new Error("github_user_name input is required");
    }

    if (!githubToken) {
      throw new Error("github_token input is required. Please provide it via the github_token input or ensure GITHUB_TOKEN is available in the environment.");
    }

    console.log(`🐍 Starting snake generation for user: ${userName}`);
    console.log(`📝 Processing ${outputs.length} output(s)`);

    // Add custom snake configuration to all outputs if enabled
    if (useCustomSnake) {
      console.log(`🎨 Custom snake rendering enabled (emoji/letters/images)`);
      if (customSnakeConfig) {
        console.log(`📦 Using custom visual configuration`);
      }

      outputs.forEach(output => {
        if (output) {
          output.drawOptions.useCustomSnake = true;
          if (customSnakeConfig) {
            output.drawOptions.customSnakeConfig = customSnakeConfig;
          }
        }
      });
    }

    // Add contribution counter configuration to all outputs if enabled
    if (showContributionCounter) {
      if (counterDisplays && counterDisplays.length > 0) {
        console.log(`📊 Contribution counter enabled with ${counterDisplays.length} display(s)`);
        if (counterDebug) {
          console.log(`🐛 Debug mode enabled for contribution counter`);
        }

        // Note: contributionMap will be built in generate-contribution-snake.ts
        outputs.forEach(output => {
          if (output) {
            const urlHideValue = output.animationOptions.contributionCounter?.hideProgressBar;

            output.animationOptions.contributionCounter = {
              enabled: true,
              displays: counterDisplays,
              // Preserve hideProgressBar from URL params or use INPUT_HIDE_PROGRESS_BAR
              hideProgressBar: urlHideValue ?? hideProgressBar,
              forceAnimations: forceAnimations,
              debug: counterDebug, // Enable debug logging
            };
          }
        });
      } else {
        // Counter enabled but no displays - still enable counter for progress bar
        console.log(`📊 Contribution counter enabled (no displays, progress bar only)`);

        outputs.forEach(output => {
          if (output) {
            const urlHideValue = output.animationOptions.contributionCounter?.hideProgressBar;

            output.animationOptions.contributionCounter = {
              enabled: true,
              // Preserve hideProgressBar from URL params or use INPUT_HIDE_PROGRESS_BAR
              hideProgressBar: urlHideValue ?? hideProgressBar,
              forceAnimations: forceAnimations,
              debug: counterDebug, // Enable debug logging
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