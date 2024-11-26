import {Command} from "commander";
import figlet from "figlet";
import { getDirectory, organizeFiles } from "./lib.js"
import {confirm, input} from "@inquirer/prompts";
import {getRecommendations} from "./api.js";
import dotenv from "dotenv";

const program = new Command();
dotenv.config();

console.log(figlet.textSync("TidyUp"));

program
  .version("1.0.0")
  .description("Your AI file organizer!")

program.action(async () => {
  const directory = await getDirectory();
  const confirmSubdirectoryOrg = await confirm({
    message: "Should I also organize the files inside the folders within the folder you provided?"
  })
  const confirmReorganization = await confirm({
    message: "Do you want me to organize the directory based on AI's suggestions?"
  })
  const additionalText = await input({
    message: "Is there anything else you want me to know before I start organizing?"
  })

  await organizeFiles({directory, confirmSubdirectoryOrg, confirmReorganization, additionalText})
})

program.parse(process.argv);
