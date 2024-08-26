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

        logInfo(`Executing clip liquidation: ${clipSize} ICP at ${bestPrice} USDT`);

        const swapOrder = await retry(() => swapICPtoUSDT(clipSize, bestPrice));
        logInfo(`Clip liquidation order placed: ${swapOrder.orderId}`);

        const orderStatus = await retry(() => checkOrderStatus(swapOrder.orderId));

        if (orderStatus.status === 'FILLED') {
            logInfo(`Clip liquidation successful: ${clipSize} ICP sold at ${bestPrice} USDT`);
        } else {
            logInfo(`Clip liquidation partially filled or failed. Status: ${orderStatus.status}`);
        }
    } catch (error) {
        logError('Error during clip liquidation', error as Error);
    }
}

async function main() {
    try {
        // 1. Check ICP maintenance status - Only on mainnet
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
        console.log("orderBook: " , orderBook);

        const currentPrice = parseFloat(orderBook.bids[0][0]);
        console.log("currentPrice: " , currentPrice);

        let remainingBalance = parseFloat(icpBalance);
        const totalClips = calculateClips(remainingBalance, currentPrice);
        const clipSizeICP = CONFIG.CLIP_SIZE_USDT / currentPrice;

        for (let i = 0; i < totalClips; i++) {
            await executeClipLiquidation(clipSizeICP);

            remainingBalance -= clipSizeICP;

            if (i < totalClips - 1) {
                const delay = getRandomDelay();
                logInfo(`Waiting ${delay}ms before next clip liquidation`);
                await sleep(delay);
            }
        }

        // Handle remaining balance if it's less than a full clip but still significant
        if (remainingBalance > 1) {
            await executeClipLiquidation(remainingBalance);
        }

        const finalIcpBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.ICP));
        const finalUsdtBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.USDT));
        logInfo(`Final ICP balance: ${finalIcpBalance}`);
        logInfo(`Final USDT balance: ${finalUsdtBalance}`);

    } catch (error) {
        logError('An error occurred during the process', error as Error);
    }
}

main();