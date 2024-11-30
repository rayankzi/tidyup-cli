#! /usr/bin/env node
import { confirm, input } from "@inquirer/prompts"
import boxen from "boxen"
import chalk from "chalk"
import { Command } from "commander"
import dotenv from "dotenv"
import figlet from "figlet"
import { pastel } from "gradient-string"
import { getDirectory, organizeFiles } from "./lib.js"

dotenv.config()
const program = new Command()

console.log(pastel(figlet.textSync("TidyUp", { horizontalLayout: "full" })))

console.log(
  boxen(chalk.bold("Hi! I'm TidyUp, your AI-powered file organizer."), {
    padding: 1,
    margin: 1,
    borderColor: "cyan"
  })
)

program.version("1.0.0").description("Your AI file organizer!")

program.action(async () => {
  const directory = await getDirectory()
  const confirmSubdirectoryOrg = await confirm({
    message:
      "Should I also give suggestions on how to organize the files inside the folders within the folder you provided?"
  })
  const additionalText = await input({
    message:
      "Is there anything else you want me to know before I start organizing?"
  })

  await organizeFiles({
    directory,
    confirmSubdirectoryOrg,
    additionalText
  })
})

program.parse(process.argv)
