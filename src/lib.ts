import * as fs from "node:fs"
import path from "node:path"
import { confirm, input, select } from "@inquirer/prompts"
import chalk from "chalk"
import ora from "ora"
import { getRecommendations } from "./api.js"
import { FolderContents, FolderResult, OrganizationOptions } from "./schema.js"

export const runWithSpinner = async <T>(
  task: () => Promise<T>,
  message: string
): Promise<T> => {
  const spinner = ora(message).start()

  try {
    const result = await task()
    spinner.succeed(`${message} ✅`)
    return result
  } catch (error) {
    spinner.fail(`${message} ❌`)
    console.error(error.message || "An error occurred.")
    throw error
  }
}

export const getDirectory = async () => {
  let directory: string

  const userInput = await select({
    message: "Select the directory I will organize",
    choices: [
      {
        name: "Current",
        value: "current",
        description: "The current directory you are in"
      },
      {
        name: "Custom",
        value: "custom",
        description:
          "Input a directory different from the one you are currently in"
      }
    ]
  })

  if (userInput === "current") {
    directory = process.cwd()
  } else {
    const customDirectory = await input({
      message: "Please enter the custom directory path:",
      validate: (input) => {
        const resolvedPath = path.resolve(input)
        if (
          fs.existsSync(resolvedPath) &&
          fs.statSync(resolvedPath).isDirectory()
        ) {
          return true
        } else {
          return "The provided path is not a valid directory. Please try again."
        }
      }
    })

    directory = path.resolve(customDirectory)
  }

  return directory
}

export const getFolderContents = (
  folderPath: string,
  listSubdirectories: boolean,
  indentLevel = 0
): { treeRepresentation: string } => {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`The folder path "${folderPath}" does not exist.`)
  }

  const stats = fs.statSync(folderPath)
  if (!stats.isDirectory()) {
    throw new Error(`The path "${folderPath}" is not a directory.`)
  }

  let treeRepresentation = `${"  ".repeat(indentLevel)}- ${path.basename(folderPath)}\n`

  const items = fs.readdirSync(folderPath)
  for (const item of items) {
    const itemPath = path.join(folderPath, item)
    const itemStats = fs.statSync(itemPath)

    if (itemStats.isDirectory()) {
      if (listSubdirectories) {
        // Recursively retrieve subfolder contents
        const subfolderResult = getFolderContents(
          itemPath,
          true,
          indentLevel + 1
        )
        treeRepresentation += subfolderResult.treeRepresentation
      } else {
        // Only list the subfolder name in the tree representation
        treeRepresentation += `${"  ".repeat(indentLevel + 1)}- ${item}/\n`
      }
    } else if (itemStats.isFile()) {
      // Add file details and include in the tree representation
      const modifiedDate = itemStats.mtime
      treeRepresentation += `${"  ".repeat(indentLevel + 1)}- ${item} (Modified: ${modifiedDate.toISOString()})\n`
    }
  }

  return { treeRepresentation }
}

export const saveRecommendations = (info: string) => {
  const filePath = path.join(process.cwd(), "recommendations.txt")

  try {
    fs.writeFileSync(filePath, info, "utf8")
  } catch (error) {
    console.error(`Error saving recommendations: ${error.message}`)
  }
}

export const displayRecommendations = (recommendations: string) => {
  recommendations = recommendations.replace(
    "Explanation of Recommendations:",
    ""
  )
  const title = chalk.bold.underline.cyan("Explanation of Recommendations:")
  const treeTitle = chalk.bold.cyan("\nRevised Directory Tree:\n")
  const additionalNotesTitle = chalk.bold.cyan("\nAdditional Notes:\n")

  const [explanation, tree, additionalNotes] = recommendations.split(
    /Revised Directory Tree:|Additional Notes:/g
  )

  const treeRepresentation = tree
    ?.trim()
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trim()

      // Check for specific patterns to style lines
      if (line.includes("Modified:")) {
        // Highlight files and modified dates separately
        const [beforeDate, afterDate] = trimmedLine.split("(Modified:")
        const fileName = chalk.yellow(beforeDate.trim())
        const modifiedDate = chalk.gray(`(Modified:${afterDate.trim()}`)
        return line.replace(trimmedLine, `${fileName} ${modifiedDate}`) // Replace while preserving original spaces
      } else if (line.includes("/")) {
        return line.replace(trimmedLine, chalk.blueBright(trimmedLine)) // Bright blue for folders
      }

      return line.replace(trimmedLine, chalk.white(trimmedLine)) // Default white for other text
    })
    .join("\n")

  // Format additional notes with green for bullet points
  const formattedNotes = additionalNotes
    ?.trim()
    .split("\n")
    .map((line) => chalk.white(line.trim()))
    .join("\n")

  // Display in terminal
  console.log(title)
  console.log(chalk.white(explanation.trim()))
  console.log(treeTitle)
  console.log(treeRepresentation)
  console.log(additionalNotesTitle)
  console.log(formattedNotes)
}

export const organizeFiles = async ({
  directory,
  confirmSubdirectoryOrg,
  additionalText
}: OrganizationOptions) => {
  try {
    const { treeRepresentation } = getFolderContents(
      directory,
      confirmSubdirectoryOrg
    )

    const recommendations = await runWithSpinner(
      () => getRecommendations(treeRepresentation, additionalText),
      "Fetching AI recommendations"
    )

    displayRecommendations(recommendations)

    const doesSaveFile = await confirm({
      message: "Do you want me to save the AI's recommendations in a text file?"
    })

    if (doesSaveFile) saveRecommendations(recommendations)

    // const newTreeRepresentation: FolderContents =
    //   parseTreeRepresentation(recommendations)

    // console.log(newTreeRepresentation)
  } catch (error) {
    console.error("Failed to organize files:", error.message || error)
  }
}
