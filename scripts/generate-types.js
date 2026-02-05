import { execSync } from 'child_process';
import { config } from 'dotenv';

config();

const API_URL = process.env.VITE_API_URL;

if (!API_URL) {
  console.error('Error: VITE_API_URL is not set in .env');
  process.exit(1);
}

const command = `openapi-typescript ${API_URL}/v3/api-docs -o src/types/api.generated.ts`;

console.log(`Generating types from: ${API_URL}/v3/api-docs`);

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to generate types');
  process.exit(1);
}
