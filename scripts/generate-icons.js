import { execSync } from 'child_process';
import path from 'path';

console.log('Generating all app icons (Web, PWA, and Android APK) from official logo...');
try {
  execSync('python3 ' + path.resolve('scripts/generate_all_app_icons.py'), { stdio: 'inherit' });
  console.log('✔ All app icons generated successfully!');
} catch (e) {
  console.error('Error generating icons:', e);
}
