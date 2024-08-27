### Project Context

This project is a cryptocurrency trading application that interacts with the Binance API to perform operations involving the ICP (Internet Computer Protocol) and USDT (Tether). The main functionalities include:

- Checking the maintenance status of the ICP asset.
- Retrieving deposit addresses for ICP.
- Checking account balances for ICP and USDT.
- Swapping ICP for USDT.
- Monitoring the status of swap orders.
- Executing clip liquidations based on the current market price.

### Scripts

1. **Install Dependencies**:
   Ensure you have Node.js and npm installed. Then, navigate to the project directory and run:
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**:
   Create a `.env` file in the root directory of the project and add your Binance API credentials:
   ```
   BINANCE_API_KEY=your_api_key
   BINANCE_API_SECRET=your_api_secret
   BINANCE_BASE_URL=https://api.binance.com
   ```

3. **Compile TypeScript**:
   To compile the TypeScript files into JavaScript, run:
   ```bash
   npm run build
   ```

4. **Run the Application**:
   After compilation, you can run the main script using:
   ```bash
   npm run start
   ```

### Note
Make sure to replace `your_api_key` and `your_api_secret` with your actual Binance API credentials. Additionally, ensure that your API key has the necessary permissions to perform the required operations.