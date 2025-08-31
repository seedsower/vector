// Polyfills for Solana web3.js browser compatibility
import { Buffer } from 'buffer';

// Make Buffer available globally
(window as any).Buffer = Buffer;
(window as any).global = window;

export { Buffer };