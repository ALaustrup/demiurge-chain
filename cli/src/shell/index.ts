/**
 * Interactive shell module
 */

export { showSplash, showHeader, showWelcome, showBox, showLoading } from './splash';
export { 
  session, 
  getConfig, 
  setConfig, 
  setWallet, 
  clearWallet, 
  setAuth, 
  clearAuth,
  getSessionSummary,
  hasWallet,
  isAuthenticated,
  resetSession,
  getPrompt,
} from './session';
export { showMenu, runMainMenu, MAIN_MENU } from './menu';
export { showFullHelp, showCommandHelp, showQuickHelp, COMMANDS } from './help';

import chalk from 'chalk';
import { showSplash, showWelcome } from './splash';
import { runMainMenu } from './menu';
import { getSessionSummary, getConfig } from './session';

/**
 * Launch the interactive shell
 */
export async function launchInteractiveShell(): Promise<void> {
  // Show splash screen
  const animate = getConfig('showAnimations');
  await showSplash(animate);
  
  // Show welcome message
  showWelcome(getSessionSummary());
  
  // Run the main menu loop
  await runMainMenu();
}
