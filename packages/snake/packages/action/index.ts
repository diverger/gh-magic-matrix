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
      process.env.GITHUB_TOKEN ?? core.getInput("github_token");

    if (!userName) {
      throw new Error("github_user_name input is required");
    }

    console.log(`🐍 Starting snake generation for user: ${userName}`);
    console.log(`📝 Processing ${outputs.length} output(s)`);

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