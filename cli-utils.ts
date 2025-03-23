import { createInterface } from "readline";

/**
 * Generates a progress bar string.
 * @param progress - Progress percentage (0 to 100)
 * @returns string - The progress bar
 */
export const generateProgressBar = (
  progress: number,
  currentVideoCount?: number,
  totalVideoCount?: number
): void => {
  const barLength = 40;
  const filledLength = Math.round((barLength * progress) / 100);
  const emptyLength = barLength - filledLength;
  const filledBar = "█".repeat(filledLength);
  const emptyBar = "░".repeat(emptyLength);

  const percentage = progress.toFixed(2);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${filledBar}${emptyBar} ${percentage}%` +
      (currentVideoCount ? ` - ${currentVideoCount}/${totalVideoCount}` : "")
  );
  process.stdout.cursorTo(0);
};

/**
 * Prompts the user for input via the terminal.
 * @param question - The question to ask the user.
 * @returns Promise<string> - The user's input.
 */
const promptUser = (question: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
};

/**
 * Prompts the user to select from a list of options.
 * @param options - Array of options to display.
 * @returns Promise<string> - The selected option.
 */
export const selectOption = async (options: string[]): Promise<string> => {
  console.log("Select the desired video quality:");
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });

  const input = await promptUser("Enter the number of your choice: ");
  const choiceIndex = parseInt(input, 10) - 1;

  if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= options.length) {
    console.error("Invalid choice. Please try again.");
    return selectOption(options); // Recursive call for valid input
  }

  return options[choiceIndex];
};
