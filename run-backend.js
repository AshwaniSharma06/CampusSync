import { existsSync } from 'fs';
import { spawn } from 'child_process';

const isWin = process.platform === 'win32';
const venvPy = isWin ? 'backend/venv/Scripts/python.exe' : 'backend/venv/bin/python';
const py = existsSync(venvPy) ? venvPy : 'python';

console.log(`[CampusSync] Launching FastAPI server using: ${py}`);
const child = spawn(py, ['-m', 'uvicorn', 'backend.main:app', '--reload', '--port', '8000'], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code || 0));
