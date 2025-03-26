/**
 * 环境变量验证工具
 * 用于确保所有必要的环境变量都已正确设置
 */

const requiredEnvVars = ["OPENROUTER_API_KEY", "EXA_SEARCH_API_KEY"];

export function validateEnv(): { valid: boolean; missingVars: string[] } {
  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar] || process.env[envVar] === ""
  );

  return {
    valid: missingVars.length === 0,
    missingVars,
  };
}

export function logEnvStatus(): void {
  const { valid, missingVars } = validateEnv();

  if (valid) {
    console.log("✅ 所有环境变量已正确设置");
  } else {
    console.error("❌ 缺少以下环境变量:");
    missingVars.forEach((envVar) => console.error(`  - ${envVar}`));
    console.error("\n请在 .env.local 文件中设置这些变量");
  }
}
