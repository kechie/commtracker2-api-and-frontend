const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const generateSecretKey = (length = 64) => {
  return crypto.randomBytes(length).toString("hex");
};

const updateEnvFile = (key, filePath = ".env") => {
  const envPath = path.resolve(__dirname, filePath);
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    const updatedContent = envContent.replace(/JWT_SECRET=.*\n?/, "");
    envContent = updatedContent;
  }

  if (envContent && !envContent.endsWith("\n")) {
    envContent += "\n";
  }

  envContent += `JWT_SECRET=${key}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log(`Updated ${filePath} with new JWT_SECRET.`);
};

const secretKey = generateSecretKey();
updateEnvFile(secretKey);
