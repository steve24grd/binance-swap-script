"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMaintenanceStatus = checkMaintenanceStatus;
exports.getDepositAddress = getDepositAddress;
exports.getAccountBalance = getAccountBalance;
exports.swapICPtoUSDT = swapICPtoUSDT;
exports.checkOrderStatus = checkOrderStatus;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("./config");
const api = axios_1.default.create({
    baseURL: config_1.CONFIG.BASE_URL,
    headers: {
        'X-MBX-APIKEY': config_1.CONFIG.API_KEY,
    },
});
function signRequest(query) {
    return crypto_1.default
        .createHmac('sha256', config_1.CONFIG.API_SECRET)
        .update(query)
        .digest('hex');
}
async function privateGetRequest(endpoint, params = {}) {
    const timestamp = Date.now();
    const queryString = Object.entries({ ...params, timestamp, recvWindow: config_1.CONFIG.RECV_WINDOW })
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    const signature = signRequest(queryString);
    const url = `${endpoint}?${queryString}&signature=${signature}`;
    try {
        const response = await api.get(url);
        return response.data;
    }
    catch (error) {
        throw handleApiError(error);
    }
}
async function privatePostRequest(endpoint, params = {}) {
    const timestamp = Date.now();
    const queryString = Object.entries({ ...params, timestamp, recvWindow: config_1.CONFIG.RECV_WINDOW })
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    const signature = signRequest(queryString);
    try {
        const response = await api.post(`${endpoint}?signature=${signature}`, queryString);
        return response.data;
    }
    catch (error) {
        throw handleApiError(error);
    }
}
function handleApiError(error) {
    var _a, _b, _c, _d, _e;
    const apiError = new Error(((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.msg) || error.message);
    apiError.code = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.code;
    apiError.url = (_e = error.config) === null || _e === void 0 ? void 0 : _e.url;
    return apiError;
}
async function checkMaintenanceStatus(asset) {
    const response = await privateGetRequest('/sapi/v1/capital/config/getall');
    const assetInfo = response.find((coin) => coin.coin === asset);
    if (!assetInfo) {
        throw new Error(`Asset ${asset} not found`);
    }
    return {
        isUnderMaintenance: !assetInfo.depositAllEnable || !assetInfo.withdrawAllEnable,
        details: `Deposit: ${assetInfo.depositAllEnable ? 'Enabled' : 'Disabled'}, Withdraw: ${assetInfo.withdrawAllEnable ? 'Enabled' : 'Disabled'}`,
    };
}
async function getDepositAddress(asset) {
    const response = await privateGetRequest('/sapi/v1/capital/deposit/address', { coin: asset });
    return {
        address: response.address,
        tag: response.tag,
    };
}
async function getAccountBalance(asset) {
    const response = await privateGetRequest('/api/v3/account');
    const balance = response.balances.find((b) => b.asset === asset);
    if (!balance) {
        throw new Error(`Balance for ${asset} not found`);
    }
    return balance.free;
}
async function swapICPtoUSDT(amount) {
    const params = {
        symbol: config_1.CONFIG.SYMBOLS.ICP_USDT,
        side: 'SELL',
        type: 'MARKET',
        quantity: amount.toFixed(8),
    };
    return privatePostRequest('/api/v3/order', params);
}
async function checkOrderStatus(orderId) {
    return privateGetRequest('/api/v3/order', {
        symbol: config_1.CONFIG.SYMBOLS.ICP_USDT,
        orderId,
    });
}
