"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.CONFIG = {
    API_KEY: process.env.BINANCE_API_KEY || '',
    API_SECRET: process.env.BINANCE_API_SECRET || '',
    BASE_URL: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
    RECV_WINDOW: 5000,
    SYMBOLS: {
        ICP_USDT: 'ICPUSDT',
    },
    ASSETS: {
        ICP: 'ICP',
        USDT: 'USDT',
    },
};
if (!exports.CONFIG.API_KEY || !exports.CONFIG.API_SECRET) {
    throw new Error('API_KEY and API_SECRET must be provided in the .env file');
}
if (!exports.CONFIG.BASE_URL) {
    throw new Error('BASE_URL must be provided in the .env file');
}
