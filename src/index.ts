import { checkMaintenanceStatus, getDepositAddress, getAccountBalance, swapICPtoUSDT, checkOrderStatus } from './api';
import { logError, logInfo, retry } from './utils';
import { CONFIG } from './config';

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

        // 3. Check ICP balance
        const icpBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.ICP));
        logInfo(`Current ICP balance: ${icpBalance}`);

        // 4. Check USDT balance
        const usdtBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.USDT));
        logInfo(`Current USDT balance: ${usdtBalance}`);

        // 5. Swap ICP to USDT
        const swapAmount = 1.0; // Example amount, adjust as needed
        if (parseFloat(icpBalance) < swapAmount) {
            logInfo(`Insufficient ICP balance for swap. Required: ${swapAmount}, Available: ${icpBalance}`);
            return;
        }

        const swapOrder = await retry(() => swapICPtoUSDT(swapAmount));
        logInfo(`Swap order placed: ${swapOrder.orderId}`);

        // 6. Check swap result
        let orderStatus = await retry(() => checkOrderStatus(swapOrder.orderId));
        let retries = 5;
        while (orderStatus.status !== 'FILLED' && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
            orderStatus = await retry(() => checkOrderStatus(swapOrder.orderId));
            retries--;
        }

        if (orderStatus.status === 'FILLED') {
            logInfo('Swap completed successfully');
        } else {
            logInfo(`Swap order final status: ${orderStatus.status}`);
        }

        // 7. Get updated portfolio
        const updatedIcpBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.ICP));
        const updatedUsdtBalance = await retry(() => getAccountBalance(CONFIG.ASSETS.USDT));
        logInfo(`Updated ICP balance: ${updatedIcpBalance}`);
        logInfo(`Updated USDT balance: ${updatedUsdtBalance}`);

    } catch (error) {
        logError('An error occurred during the process', error as Error);
    }
}

main();