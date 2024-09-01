import fs from 'fs/promises';
import { ApiResponse, ResponseStorage } from './types';

export class FileResponseStorage implements ResponseStorage {
    private filePath: string;
    private buffer: ApiResponse[] = [];

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async store(response: ApiResponse) {
        this.buffer.push(response);
        if (this.buffer.length >= 10) {
            await this.flush();
        }
    }

    private async flush() {
        try {
            let existingData: { responses: ApiResponse[] } = { responses: [] }; // Define type explicitly
            try {
                const fileContent = await fs.readFile(this.filePath, 'utf-8');
                existingData = JSON.parse(fileContent);
            } catch (error) {
                // File doesn't exist or is empty, use default empty structure
            }

            existingData.responses.push(...this.buffer);
            await fs.writeFile(this.filePath, JSON.stringify(existingData, null, 2));
            this.buffer = [];
        } catch (error) {
            console.error('Error writing to response log:', error);
        }
    }

    async close() {
        await this.flush();
    }
}