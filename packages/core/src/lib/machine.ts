import { execSync } from 'node:child_process';
import os from 'node:os';

/**
 * Retrieves a stable machine ID for device-binding.
 * Supports Mac, Linux, and Windows fallbacks.
 */
export function getMachineId(): string {
  try {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      return execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk \'{print $3}\'', { encoding: 'utf8' })
        .replace(/"/g, '')
        .trim();
    }
    
    if (platform === 'linux') {
      const fs = require('node:fs');
      if (fs.existsSync('/etc/machine-id')) {
        return fs.readFileSync('/etc/machine-id', 'utf8').trim();
      }
      if (fs.existsSync('/var/lib/dbus/machine-id')) {
        return fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim();
      }
    }
    
    if (platform === 'win32') {
      return execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', { encoding: 'utf8' })
        .split('REG_SZ')[1]
        .trim();
    }
  } catch (e) {
    // Zero-config fallback (less stable but works everywhere as a last resort)
    return `${os.hostname()}-${os.arch()}-${os.totalmem()}`;
  }

  return 'zms-default-machine-id';
}
