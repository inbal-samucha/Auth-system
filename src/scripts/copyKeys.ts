import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.join(__dirname, '..', '..','utils', 'keys'); //"build": "rm -rf dist && npx tsc && node dist/scripts/copyKeys.js"
const destDir = path.join(__dirname, '..', '..', 'dist', 'utils', 'keys');

function copyFiles(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach((file: string) => {
    const srcFile: string = path.join(src, file);
    const destFile: string = path.join(dest, file);

    fs.copyFileSync(srcFile, destFile);
  });
}

try {
  copyFiles(srcDir, destDir);
  console.log('Keys copied successfully!');
} catch (error) {
  console.error('Error copying key files:', error);
}
