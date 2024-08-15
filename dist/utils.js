"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logError = logError;
exports.sleep = sleep;
exports.retry = retry;
function logInfo(message) {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
}
function logError(message, error) {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) {
        if (error.code) {
            console.error(`Code: ${error.code}`);
        }
        if (error.url) {
            console.error(`URL: ${error.url}`);
        }
        console.error(error.stack);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            logError(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error);
            await sleep(delay);
            delay *= 2; // Exponential backoff
        }
    }
    throw lastError || new Error('All retry attempts failed');
}
