import {
    checkMaintenanceStatus,
    getDepositAddress,
    getAccountBalance,
    swapICPtoUSDT,
    checkOrderStatus,
    getOrderBook
} from './api';
import {
    logError,
    logInfo,
    retry,
    sleep,
    calculateClips,
    findBestPrice,
    getRandomDelay
} from './utils';
import { CONFIG } from './config';

async function executeClipLiquidation(clipSize: number): Promise<void> {
    try {
        const orderBook = await retry(() => getOrderBook(CONFIG.SYMBOLS.ICP_USDT));
        const bestPrice = findBestPrice(orderBook, clipSize);

        logInfo(`Executing clip liquidation: ${clipSize.toFixed(8)} ICP at ${bestPrice} USDT`);

        const swapOrder = await retry(() => swapICPtoUSDT(Math.floor(clipSize), bestPrice));
        logInfo(`Clip liquidation order placed: ${swapOrder.orderId}`);

        const orderStatus = await retry(() => checkOrderStatus(swapOrder.orderId));

        if (orderStatus.status === 'FILLED') {
            logInfo(`Clip liquidation successful: ${clipSize.toFixed(8)} ICP sold at ${bestPrice} USDT`);
        } else {
            logInfo(`Clip liquidation partially filled or failed. Status: ${orderStatus.status}`);
        }
    } catch (error) {
        logError('Error during clip liquidation', error as Error);
    }
}

async function main() {
    try {
        // 1. Check ICP maintenance status
        const maintenanceStatus = await retry(() => checkMaintenanceStatus(CONFIG.ASSETS.ICP));
        if (maintenanceStatus.isUnderMaintenance) {
            logInfo(`ICP is currently under maintenance. Details: ${maintenanceStatus.details}`);
            return;
        }

        // 2. Get ICP deposit address
        const depositAddress = await retry(() => getDepositAddress(CONFIG.ASSETS.ICP));
        logInfo(`ICP deposit address: ${depositAddress.address}`);
        if (depositAddress.tag) {
            logInfo(`ICP deposit tag: ${depositAddress.tag}`);
        }

        // 3. Check ICP balance & USDT balance
        const icpBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.ICP));
        logInfo(`Current ICP balance: ${icpBalance}`);

        const usdtBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.USDT));
        logInfo(`Current USDT balance: ${usdtBalance}`);

        const orderBook = await retry(() => getOrderBook(CONFIG.SYMBOLS.ICP_USDT));
        const currentPrice = parseFloat(orderBook.bids[0][0]);

        if (currentPrice <= 0) {
            logError(`Invalid current price: ${currentPrice}. Exiting.`);
            return;
        }

        let remainingBalance = parseFloat(icpBalance);
        const totalClips = calculateClips(remainingBalance, currentPrice);
        let clipSizeICP = Math.round(CONFIG.CLIP_SIZE_USDT / currentPrice);

        logInfo(`Total clips: ${totalClips}, Initial clip size: ${clipSizeICP} ICP`);

        if (clipSizeICP < 1.0) {
            logInfo("Clip size is too small. Setting clip size to 1.0 ICP...");
            clipSizeICP = 1.0;
        }

        for (let i = 0; i < totalClips; i++) {
            const currentClipSize = Math.min(clipSizeICP, remainingBalance);
            logInfo(`Executing clip ${i + 1} of ${totalClips}, size: ${currentClipSize.toFixed(8)} ICP`);
            await executeClipLiquidation(currentClipSize);

            remainingBalance -= currentClipSize;
            logInfo(`Remaining balance: ${remainingBalance.toFixed(8)} ICP`);

            if (remainingBalance < 1 || i === totalClips - 1) break;

            if (i < totalClips - 1) {
                const delay = getRandomDelay();
                logInfo(`Waiting ${delay}ms before next clip liquidation`);
                await sleep(delay);
            }
        }

        // Handle any remaining balance
        if (remainingBalance >= 1) {
            logInfo(`Sweeping remaining balance: ${remainingBalance.toFixed(8)} ICP`);
            await executeClipLiquidation(remainingBalance);
        } else if (remainingBalance > 0) {
            logInfo(`Remaining balance ${remainingBalance.toFixed(8)} ICP is too small to swap.`);
        }

        const finalIcpBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.ICP));
        const finalUsdtBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.USDT));
        logInfo(`Final ICP balance: ${finalIcpBalance}`);
        logInfo(`Final USDT balance: ${finalUsdtBalance}`);

    } catch (error) {
        logError('An error occurred during the process', error as Error);
        process.exit(1);
    }
}

main();