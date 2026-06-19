// lib/validateBuildCommand.ts
const ALLOWED_COMMANDS = [
  /^npm run \w[\w:-]*$/,
  /^yarn \w[\w:-]*$/,
  /^pnpm run \w[\w:-]*$/,
  /^npx \w[\w@/-]+ [\w/-]*$/,
];

export function validateBuildCommand(cmd: string): boolean {
  return ALLOWED_COMMANDS.some((pattern) => pattern.test(cmd.trim()));
}
