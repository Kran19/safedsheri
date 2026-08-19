'use server';

import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const MAINTENANCE_FILE = path.join(process.cwd(), '.maintenance');

export async function getMaintenanceMode() {
  try {
    return fs.existsSync(MAINTENANCE_FILE);
  } catch {
    return false;
  }
}

export async function toggleMaintenanceMode(currentState: boolean) {
  try {
    if (currentState) {
      // Turn off
      if (fs.existsSync(MAINTENANCE_FILE)) {
        fs.unlinkSync(MAINTENANCE_FILE);
      }
    } else {
      // Turn on
      fs.writeFileSync(MAINTENANCE_FILE, 'on', 'utf8');
    }
    revalidatePath('/');
    return !currentState;
  } catch (error) {
    console.error('Failed to toggle maintenance mode:', error);
    return currentState;
  }
}
