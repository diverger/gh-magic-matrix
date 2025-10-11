import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { convertSVGToLEDBillboard, LEDMatrixConfig } from './index';

async function run() {
  try {
    // Get inputs
    const inputPath = core.getInput('input_path') || 'images/*.svg';
    const outputPath = core.getInput('output_path') || 'led-billboard.svg';
    const width = parseInt(core.getInput('matrix_width') || '0');
    const height = parseInt(core.getInput('matrix_height') || '0');
    const cellSize = parseInt(core.getInput('cell_size') || '8');
    const cellGap = parseInt(core.getInput('cell_gap') || '2');
    const cellRadius = parseInt(core.getInput('cell_radius') || '1');
    const backgroundColor = core.getInput('background_color') || '#000000';
    const ledOnColor = core.getInput('led_on_color') || '#00ff00';
    const ledOffColor = core.getInput('led_off_color') || '#003300';
    const stretch = core.getInput('stretch') === 'true';
    const frameDurationStr = core.getInput('frame_durations') || '';

    console.log('🎬 LED Billboard Generator');
    console.log(`📂 Input path: ${inputPath}`);
    console.log(`📊 Matrix size: ${width || 'auto'} x ${height || 'auto'}`);
    console.log(`🎨 Colors: BG=${backgroundColor}, ON=${ledOnColor}, OFF=${ledOffColor}`);
    console.log(`📐 Stretch: ${stretch ? 'Fill matrix (may distort)' : 'Maintain aspect ratio'}`);

    // Parse input path - support glob patterns or single file
    let svgFiles: string[] = [];

    if (inputPath.includes('*')) {
      // Simple glob implementation - just handle *.svg in a directory
      const dir = path.dirname(inputPath);
      const pattern = path.basename(inputPath);

      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        svgFiles = files
          .filter(f => f.endsWith('.svg'))
          .map(f => path.join(dir, f))
          .sort(); // Sort alphabetically for consistent frame order
      }
    } else if (fs.existsSync(inputPath)) {
      if (fs.statSync(inputPath).isDirectory()) {
        // Read all SVG files from directory
        const files = fs.readdirSync(inputPath);
        svgFiles = files
          .filter(f => f.endsWith('.svg'))
          .map(f => path.join(inputPath, f))
          .sort();
      } else {
        // Single file
        svgFiles = [inputPath];
      }
    } else {
      throw new Error(`Input path not found: ${inputPath}`);
    }

    if (svgFiles.length === 0) {
      throw new Error(`No SVG files found in: ${inputPath}`);
    }

    console.log(`📁 Found ${svgFiles.length} SVG file(s)`);

    // Read all SVG contents
    const svgContents = svgFiles.map(file => {
      console.log(`  - ${path.basename(file)}`);
      return fs.readFileSync(file, 'utf-8');
    });

    // Parse frame durations
    let frameDurations: number[] | undefined;
    if (frameDurationStr) {
      frameDurations = frameDurationStr.split(',').map(d => parseFloat(d.trim()) * 1000); // Convert to ms
      console.log(`⏱️  Frame durations: ${frameDurations.map(d => d / 1000 + 's').join(', ')}`);
    }

    // Build config
    const config: Partial<LEDMatrixConfig> = {
      cellSize,
      cellGap,
      cellRadius,
      backgroundColor,
      ledOnColor,
      ledOffColor,
      stretch,
    };

    if (width > 0) config.width = width;
    if (height > 0) config.height = height;

    // Generate LED billboard
    console.log('🎨 Generating LED billboard animation...');
    const billboard = convertSVGToLEDBillboard(svgContents, config, frameDurations);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write output
    fs.writeFileSync(outputPath, billboard);
    console.log(`✅ LED billboard saved to: ${outputPath}`);

    // Set output
    core.setOutput('output_path', outputPath);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed with "${error.message}"`);
    } else {
      core.setFailed(`Action failed with "${error}"`);
    }
  }
}

run();
