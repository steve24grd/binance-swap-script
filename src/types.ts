export interface MaintenanceStatus {
    isUnderMaintenance: boolean;
    details?: string;
}

export interface DepositAddress {
    address: string;
    tag?: string;
}

export interface Balance {
    asset: string;
    free: string;
    locked: string;
}

export interface Order {
    symbol: string;
    orderId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
    timeInForce: 'GTC' | 'IOC' | 'FOK';
    type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
    side: 'BUY' | 'SELL';
}

export interface ApiError extends Error {
    code?: number;
    url?: string;
}