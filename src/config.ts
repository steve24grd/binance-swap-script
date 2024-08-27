import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
    API_KEY: process.env.BINANCE_API_KEY || '',
    API_SECRET: process.env.BINANCE_API_SECRET || '',
    BASE_URL: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
    RECV_WINDOW: Number(process.env.RECV_WINDOW) || 5000, // Moved to .env
    SYMBOLS: {
        ICP_USDT: 'ICPUSDT',
    },
    ASSETS: {
        ICP: 'ICP',
        USDT: 'USDT',
    },
    CLIP_SIZE_USDT: Number(process.env.CLIP_SIZE_USDT) || 500, // Moved to .env
    MIN_DELAY_MS: 1000,
    MAX_DELAY_MS: 60000,
};

if (!CONFIG.API_KEY || !CONFIG.API_SECRET) {
    throw new Error('API_KEY and API_SECRET must be provided in the .env file');
}

if (!CONFIG.BASE_URL) {
    throw new Error('BASE_URL must be provided in the .env file');
}