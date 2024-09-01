import { ApiResponse, ResponseStorage } from './types';

export class ResponseCapture {
    private storage: ResponseStorage | null = null;

    constructor(storage: ResponseStorage | null = null) {
        this.storage = storage;
    }

    async capture(endpoint: string, method: string, response: any) {
        const apiResponse: ApiResponse = {
            endpoint,
            method,
            timestamp: new Date().toISOString(),
            response
        };

        if (this.storage) {
            await this.storage.store(apiResponse);
        }
    }

    async close() {
        if (this.storage) {
            await this.storage.close();
        }
    }
}