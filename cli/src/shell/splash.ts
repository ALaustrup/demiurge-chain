/**
 * Animated splash screen for Demiurge CLI
 */

import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';

// Custom gradient for Demiurge branding
const demiurgeGradient = gradient(['#8B5CF6', '#3B82F6', '#06B6D4']);
const accentGradient = gradient(['#06B6D4', '#10B981']);

/**
 * ASCII art for the Demiurge logo
 */
const DEMIURGE_ASCII = `
██████╗ ███████╗███╗   ███╗██╗██╗   ██╗██████╗  ██████╗ ███████╗
██╔══██╗██╔════╝████╗ ████║██║██║   ██║██╔══██╗██╔════╝ ██╔════╝
██║  ██║█████╗  ██╔████╔██║██║██║   ██║██████╔╝██║  ███╗█████╗  
██║  ██║██╔══╝  ██║╚██╔╝██║██║██║   ██║██╔══██╗██║   ██║██╔══╝  
██████╔╝███████╗██║ ╚═╝ ██║██║╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`;

const TAGLINE = '           N E X T - L E V E L   B L O C K C H A I N';

const VERSION_INFO = 'v1.0.0 | Sovereign Creative Substrate';

/**
 * Sleep helper for animations
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display animated splash screen
 */
export async function showSplash(animate = true): Promise<void> {
  // Clear screen
  console.clear();
  
  if (animate) {
    // Typewriter effect for the logo
    const lines = DEMIURGE_ASCII.split('\n');
    
    for (const line of lines) {
      process.stdout.write(demiurgeGradient(line) + '\n');
      await sleep(50);
    }
    
    // Pause
    await sleep(200);
    
    // Show tagline with fade-in effect
    console.log();
    process.stdout.write(accentGradient(TAGLINE) + '\n');
    await sleep(300);
    
    // Show version
    console.log();
    console.log(chalk.gray('                    ' + VERSION_INFO));
    await sleep(200);
    
    // Show separator
    console.log();
    console.log(chalk.gray('═'.repeat(70)));
    console.log();
  } else {
    // Static display (no animation)
    console.log(demiurgeGradient(DEMIURGE_ASCII));
    console.log();
    console.log(accentGradient(TAGLINE));
    console.log();
    console.log(chalk.gray('                    ' + VERSION_INFO));
    console.log();
    console.log(chalk.gray('═'.repeat(70)));
    console.log();
  }
}

/**
 * Display compact header (for after splash)
 */
export function showHeader(): void {
  console.log(demiurgeGradient('  DEMIURGE') + chalk.gray(' | Next-Level Blockchain'));
  console.log(chalk.gray('─'.repeat(50)));
}

/**
 * Display welcome message with session info
 */
export function showWelcome(session: { wallet?: string; qorId?: string } = {}): void {
  console.log();
  console.log(chalk.cyan('  Welcome to the Demiurge CLI'));
  console.log();
  
  if (session.qorId) {
    console.log(chalk.gray('  Logged in as: ') + chalk.green(session.qorId));
  }
  if (session.wallet) {
    console.log(chalk.gray('  Wallet: ') + chalk.yellow(session.wallet.slice(0, 10) + '...' + session.wallet.slice(-6)));
  }
  
  console.log();
  console.log(chalk.gray('  Type ') + chalk.white('help') + chalk.gray(' for available commands, or ') + chalk.white('q') + chalk.gray(' to exit.'));
  console.log();
}

/**
 * Generate figlet text with gradient
 */
export async function figletText(text: string, font: figlet.Fonts = 'Standard'): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(demiurgeGradient(result || ''));
    });
  });
}

/**
 * Show loading animation
 */
export async function showLoading(message: string, durationMs: number): Promise<void> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const startTime = Date.now();
  let frameIndex = 0;
  
  process.stdout.write('\n');
  
  while (Date.now() - startTime < durationMs) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(chalk.cyan(frames[frameIndex]) + ' ' + chalk.gray(message));
    frameIndex = (frameIndex + 1) % frames.length;
    await sleep(80);
  }
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(chalk.green('✓') + ' ' + chalk.gray(message) + '\n');
}

/**
 * Display a boxed message
 */
export function showBox(title: string, content: string[]): void {
  const maxWidth = Math.max(title.length, ...content.map(l => l.length)) + 4;
  const border = '─'.repeat(maxWidth);
  
  console.log(chalk.gray('┌' + border + '┐'));
  console.log(chalk.gray('│ ') + chalk.cyan.bold(title.padEnd(maxWidth - 2)) + chalk.gray(' │'));
  console.log(chalk.gray('├' + border + '┤'));
  
  for (const line of content) {
    console.log(chalk.gray('│ ') + line.padEnd(maxWidth - 2) + chalk.gray(' │'));
  }
  
  console.log(chalk.gray('└' + border + '┘'));
}
