import { ApiError } from './types';
import { CONFIG } from './config';

export function logInfo(message: string): void {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
}

export function logError(message: string, error?: Error | ApiError): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
        if ((error as ApiError).code) {
            console.error(`Code: ${(error as ApiError).code}`);
        }
        if ((error as ApiError).url) {
            console.error(`URL: ${(error as ApiError).url}`);
        }
        console.error(error.stack);
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            logError(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error as Error);
            await sleep(delay);
            delay *= 2; // Exponential backoff
        }
    }

    throw lastError || new Error('All retry attempts failed');
}

export function calculateClips(icpBalance: number, currentPrice: number): number {
    const totalBalanceInUSDT = icpBalance * currentPrice;
    const numberOfClips = Math.floor(totalBalanceInUSDT / CONFIG.CLIP_SIZE_USDT);
    return numberOfClips;
}

export function findBestPrice(orderBook: any, clipSize: number): number {
    let accumulatedQty = 0;
    let worstPrice = 0;

    for (const [price, qty] of orderBook.bids) {
        accumulatedQty += parseFloat(qty);
        worstPrice = parseFloat(price);
        if (accumulatedQty >= clipSize) break;
    }

    return worstPrice;
}

export function getRandomDelay(): number {
    return Math.floor(Math.random() * (CONFIG.MAX_DELAY_MS - CONFIG.MIN_DELAY_MS + 1) + CONFIG.MIN_DELAY_MS);
}