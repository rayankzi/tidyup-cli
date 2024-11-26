import {input, select} from "@inquirer/prompts";
import path from "node:path";
import * as fs from "node:fs";
import {OrganizationOptions, FolderResult, FolderContents} from "./types.js";
import ora from "ora";
import {getRecommendations} from "./api.js";


export const runWithSpinner = async <T>(task: () => Promise<T>, message: string): Promise<T> => {
  const spinner = ora(message).start();

  try {
    const result = await task();
    spinner.succeed(`${message} ✅`);
    return result;
  } catch (error) {
    spinner.fail(`${message} ❌`);
    console.error(error.message || "An error occurred.");
    throw error;
  }
};

/**
 * Gets directory from user input.
 *
 * @returns An absolute path to a directory.
 */

export const getDirectory = async () => {
  let directory: string

  const userInput = await select({
    message: 'Select the directory I will organize',
    choices: [
      {
        name: 'Current',
        value: 'current',
        description: 'The current directory you are in',
      },
      {
        name: 'Custom',
        value: 'custom',
        description: 'Input a directory different from the one you are currently in',
      },
    ],
  });

  if (userInput === "current") {
    directory = process.cwd()
  } else {
    // Blank
    const customDirectory = await input({
      message: "Please enter the custom directory path:",
      validate: (input) => {
        const resolvedPath = path.resolve(input);
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
          return true;
        } else {
          return "The provided path is not a valid directory. Please try again.";
        }
      },
    });

    directory = path.resolve(customDirectory);
  }

  return directory
}

/**
 * Recursively retrieves all files and subfolders in a given directory.
 * Also creates a tree-like string representation of the structure.
 *
 * @param folderPath - Absolute path to the folder.
 * @param listSubdirectories - If true, recursively retrieve contents of subdirectories.
 * @param indentLevel - Current indentation level for tree representation.
 * @returns An object containing folder contents and the tree representation.
 */
export const getFolderContents = (
  folderPath: string,
  listSubdirectories: boolean,
  indentLevel = 0
): FolderResult => {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`The folder path "${folderPath}" does not exist.`);
  }

  const stats = fs.statSync(folderPath);
  if (!stats.isDirectory()) {
    throw new Error(`The path "${folderPath}" is not a directory.`);
  }

  const contents: FolderContents = {files: [], subfolders: {}};
  let treeRepresentation = `${"  ".repeat(indentLevel)}- ${path.basename(folderPath)}\n`;

  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const itemStats = fs.statSync(itemPath);

    if (itemStats.isDirectory()) {
      if (listSubdirectories) {
        // Recursively retrieve subfolder contents
        const subfolderResult = getFolderContents(itemPath, true, indentLevel + 1);
        contents.subfolders[item] = subfolderResult.contents;
        treeRepresentation += subfolderResult.treeRepresentation;
      } else {
        // Only list the subfolder name in the tree representation
        treeRepresentation += `${"  ".repeat(indentLevel + 1)}- ${item}/\n`;
      }
    } else if (itemStats.isFile()) {
      // Add file details and include in the tree representation
      const modifiedDate = itemStats.mtime;
      contents.files.push({name: item, modifiedDate});
      treeRepresentation += `${"  ".repeat(indentLevel + 1)}- ${item} (Modified: ${modifiedDate.toISOString()})\n`;
    }
  }

  return {contents, treeRepresentation};
};

export const organizeFiles = async ({
  directory,
  confirmSubdirectoryOrg,
  confirmReorganization,
}: OrganizationOptions) => {
  try {
    // 1. Retrieve folder contents
    const {treeRepresentation} = await runWithSpinner(
      () => Promise.resolve(getFolderContents(directory, confirmSubdirectoryOrg)),
      "Fetching folder contents"
    );

    // 2. Get AI recommendations
    const recommendations = await runWithSpinner(
      () => getRecommendations(treeRepresentation),
      "Fetching AI recommendations"
    );

    console.log("AI Recommendations received:", recommendations);

    // 3. If confirmed, reorganize folder contents
    if (confirmReorganization) {
      await runWithSpinner(
        async () => {
          // Placeholder for actual reorganization logic
          console.log("Reorganizing files based on AI recommendations...");
          // Simulate reorganization delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
        },
        "Reorganizing folder contents"
      );
    }
  } catch (error) {
    console.error("Failed to organize files:", error.message || error);
  }
};