# ChangeNOW API integration notes

- Official API page: https://changenow.io/api
- Official Postman documentation: https://documenter.getpostman.com/view/8180765/SVfTPnM8?version=latest
- The official documentation states that an API key is issued from the partner/affiliate account and is supplied in the `x-changenow-api-key` header.
- The standard quote workflow uses available currencies, minimum exchange amount, then estimated exchange amount before any create-transaction call.
- This project currently calls only the estimated-amount endpoint from the Electron main process. It does not create exchange transactions, generate deposit addresses, submit deposits, or move assets.
- Supported input selections in the current UI are BTC, Solana (SOL), Ethereum (ETH), LTC, and USDT. USDT requires an explicit network selection.
- API keys are received at runtime through the UI and are not written to localStorage, wallet files, source code, or Git. The key is used only for the quote request in memory.
- Before production use, review ChangeNOW partner terms, regional availability, KYC requirements, quote expiry, network/provider fees, and affiliate disclosure.
