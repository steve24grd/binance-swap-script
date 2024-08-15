"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const utils_1 = require("./utils");
const config_1 = require("./config");
async function main() {
    try {
        // 1. Check ICP maintenance status - Only on mainnet
        const maintenanceStatus = await (0, utils_1.retry)(() => (0, api_1.checkMaintenanceStatus)(config_1.CONFIG.ASSETS.ICP));
        if (maintenanceStatus.isUnderMaintenance) {
            (0, utils_1.logInfo)(`ICP is currently under maintenance. Details: ${maintenanceStatus.details}`);
            return;
        }
        // 2. Get ICP deposit address
        const depositAddress = await (0, utils_1.retry)(() => (0, api_1.getDepositAddress)(config_1.CONFIG.ASSETS.ICP));
        (0, utils_1.logInfo)(`ICP deposit address: ${depositAddress.address}`);
        if (depositAddress.tag) {
            (0, utils_1.logInfo)(`ICP deposit tag: ${depositAddress.tag}`);
        }
        // 3. Check ICP balance
        const icpBalance = await (0, utils_1.retry)(() => (0, api_1.getAccountBalance)(config_1.CONFIG.ASSETS.ICP));
        (0, utils_1.logInfo)(`Current ICP balance: ${icpBalance}`);
        // 4. Check USDT balance
        const usdtBalance = await (0, utils_1.retry)(() => (0, api_1.getAccountBalance)(config_1.CONFIG.ASSETS.USDT));
        (0, utils_1.logInfo)(`Current USDT balance: ${usdtBalance}`);
        // 5. Swap ICP to USDT
        const swapAmount = 1.0; // Example amount, adjust as needed
        if (parseFloat(icpBalance) < swapAmount) {
            (0, utils_1.logInfo)(`Insufficient ICP balance for swap. Required: ${swapAmount}, Available: ${icpBalance}`);
            return;
        }
        const swapOrder = await (0, utils_1.retry)(() => (0, api_1.swapICPtoUSDT)(swapAmount));
        (0, utils_1.logInfo)(`Swap order placed: ${swapOrder.orderId}`);
        // 6. Check swap result
        let orderStatus = await (0, utils_1.retry)(() => (0, api_1.checkOrderStatus)(swapOrder.orderId));
        let retries = 5;
        while (orderStatus.status !== 'FILLED' && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before checking again
            orderStatus = await (0, utils_1.retry)(() => (0, api_1.checkOrderStatus)(swapOrder.orderId));
            retries--;
        }
        if (orderStatus.status === 'FILLED') {
            (0, utils_1.logInfo)('Swap completed successfully');
        }
        else {
            (0, utils_1.logInfo)(`Swap order final status: ${orderStatus.status}`);
        }
        // 7. Get updated portfolio
        const updatedIcpBalance = await (0, utils_1.retry)(() => (0, api_1.getAccountBalance)(config_1.CONFIG.ASSETS.ICP));
        const updatedUsdtBalance = await (0, utils_1.retry)(() => (0, api_1.getAccountBalance)(config_1.CONFIG.ASSETS.USDT));
        (0, utils_1.logInfo)(`Updated ICP balance: ${updatedIcpBalance}`);
        (0, utils_1.logInfo)(`Updated USDT balance: ${updatedUsdtBalance}`);
    }
    catch (error) {
        (0, utils_1.logError)('An error occurred during the process', error);
    }
}
main();
