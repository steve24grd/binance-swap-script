import axios from 'axios';
import crypto from 'crypto';
import { CONFIG } from './config';
import { MaintenanceStatus, DepositAddress, Balance, Order, ApiError } from './types';

const api = axios.create({
    baseURL: CONFIG.BASE_URL,
    headers: {
        'X-MBX-APIKEY': CONFIG.API_KEY,
    },
});

function signRequest(query: string): string {
    return crypto
        .createHmac('sha256', CONFIG.API_SECRET)
        .update(query)
        .digest('hex');
}

async function privateGetRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now();
    const queryString = Object.entries({ ...params, timestamp, recvWindow: CONFIG.RECV_WINDOW })
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const signature = signRequest(queryString);
    const url = `${endpoint}?${queryString}&signature=${signature}`;

    try {
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
}

async function privatePostRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now();
    const queryString = Object.entries({ ...params, timestamp, recvWindow: CONFIG.RECV_WINDOW })
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const signature = signRequest(queryString);

    try {
        const response = await api.post(`${endpoint}?signature=${signature}`, queryString);
        return response.data;
    } catch (error) {
        throw handleApiError(error);
    }
}

function handleApiError(error: any): ApiError {
    const apiError: ApiError = new Error(error.response?.data?.msg || error.message);
    apiError.code = error.response?.data?.code;
    apiError.url = error.config?.url;
    return apiError;
}

export async function checkMaintenanceStatus(asset: string): Promise<MaintenanceStatus> {
    const response = await privateGetRequest('/sapi/v1/capital/config/getall');
    const assetInfo = response.find((coin: any) => coin.coin === asset);

    if (!assetInfo) {
        throw new Error(`Asset ${asset} not found`);
    }

    return {
        isUnderMaintenance: !assetInfo.depositAllEnable || !assetInfo.withdrawAllEnable,
        details: `Deposit: ${assetInfo.depositAllEnable ? 'Enabled' : 'Disabled'}, Withdraw: ${assetInfo.withdrawAllEnable ? 'Enabled' : 'Disabled'}`,
    };
}

export async function getDepositAddress(asset: string): Promise<DepositAddress> {
    const response = await privateGetRequest('/sapi/v1/capital/deposit/address', { coin: asset });
    return {
        address: response.address,
        tag: response.tag,
    };
}

export async function getAccountBalance(asset: string): Promise<string> {
    const response = await privateGetRequest('/api/v3/account');
    const balance = response.balances.find((b: Balance) => b.asset === asset);

    if (!balance) {
        throw new Error(`Balance for ${asset} not found`);
    }

    return balance.free;
}

export async function swapICPtoUSDT(amount: number): Promise<Order> {
    const params = {
        symbol: CONFIG.SYMBOLS.ICP_USDT,
        side: 'SELL',
        type: 'MARKET',
        quantity: amount.toFixed(8),
    };

    return privatePostRequest('/api/v3/order', params);
}

export async function checkOrderStatus(orderId: number): Promise<Order> {
    return privateGetRequest('/api/v3/order', {
        symbol: CONFIG.SYMBOLS.ICP_USDT,
        orderId,
    });
}