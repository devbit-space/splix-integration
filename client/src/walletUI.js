/**
 * Wallet UI Components for Phantom Integration
 * Handles wallet connection modal and UI interactions
 */

export class WalletUI {
    constructor(phantomWallet) {
        this.phantomWallet = phantomWallet;
        this.modal = null;
        this.isModalOpen = false;
        this.transactionModal = null;
        
        this.init();
    }

    async init() {
        this.createWalletModal();
        await this.initTransactionModal();
        this.setupEventListeners();
    }

    async initTransactionModal() {
        try {
            const { TransactionModal } = await import('./transactionModal.js');
            this.transactionModal = new TransactionModal(this.phantomWallet);
        } catch (error) {
            console.error('Failed to initialize transaction modal:', error);
        }
    }

    /**
     * Create wallet connection modal
     */
    createWalletModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'walletModalOverlay';
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'fixed inset-0 flex items-center justify-center p-4';
        
        const modalCard = document.createElement('div');
        modalCard.className = 'bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4';
        
        modalCard.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">Connect Phantom Wallet</h2>
                <button id="closeWalletModal" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div id="walletOptions" class="space-y-3">
                <!-- Wallet options will be populated here -->
            </div>
            
            <div id="walletStatus" class="mt-6 p-4 bg-gray-700 rounded-lg hidden">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-400">Connected Wallet</p>
                        <p id="connectedWalletName" class="font-semibold text-white"></p>
                        <p id="connectedWalletAddress" class="text-sm text-gray-300"></p>
                    </div>
                    <button id="disconnectWallet" class="btn-secondary px-3 py-1 text-sm">
                        Disconnect
                    </button>
                </div>
            </div>
            
            <div id="walletError" class="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg hidden">
                <p id="walletErrorMessage" class="text-red-200 text-sm"></p>
            </div>
        `;
        
        modalContent.appendChild(modalCard);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        this.modal = modalOverlay;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close modal events
        const closeBtn = document.getElementById('closeWalletModal');
        const overlay = document.getElementById('walletModalOverlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });
        }

        // Disconnect wallet button
        const disconnectBtn = document.getElementById('disconnectWallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                this.phantomWallet.disconnectWallet();
            });
        }

        // Listen to wallet events
        this.phantomWallet.on('connected', (data) => {
            this.updateWalletStatus(data);
            this.closeModal();
        });

        this.phantomWallet.on('disconnected', () => {
            this.updateWalletStatus(null);
        });

        this.phantomWallet.on('balanceUpdated', (balance) => {
            this.updateBalanceDisplay(balance);
        });

        this.phantomWallet.on('error', (error) => {
            this.showError(error.message || 'An error occurred');
        });
    }

    /**
     * Open wallet connection modal
     */
    openModal() {
        this.populateWalletOptions();
        this.modal.classList.remove('hidden');
        this.isModalOpen = true;
        
        // Recreate icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Close wallet connection modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
        this.isModalOpen = false;
        this.hideError();
    }

    /**
     * Populate wallet options in modal
     */
    populateWalletOptions() {
        const walletOptions = document.getElementById('walletOptions');
        
        if (!this.phantomWallet.wallet) {
            walletOptions.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-400 mb-4">Phantom wallet not detected</p>
                    <p class="text-sm text-gray-500 mb-4">
                        Please install <a href="https://phantom.app/" target="_blank" class="text-blue-400 hover:underline">Phantom wallet</a> extension
                    </p>
                    <button onclick="window.open('https://phantom.app/', '_blank')" class="btn-primary px-4 py-2 rounded-lg">
                        Install Phantom
                    </button>
                </div>
            `;
            return;
        }

        walletOptions.innerHTML = `
            <button class="wallet-option-btn w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-3" 
                    id="connectPhantomBtn">
                <span class="text-2xl">👻</span>
                <div class="text-left">
                    <p class="font-semibold text-white">Phantom</p>
                    <p class="text-sm text-gray-400">Connect your Phantom wallet</p>
                </div>
            </button>
        `;

        // Add click listener to Phantom option
        const phantomBtn = document.getElementById('connectPhantomBtn');
        if (phantomBtn) {
            phantomBtn.addEventListener('click', async () => {
                phantomBtn.disabled = true;
                phantomBtn.innerHTML = `
                    <span class="text-2xl">👻</span>
                    <div class="text-left">
                        <p class="font-semibold text-white">Connecting...</p>
                        <p class="text-sm text-gray-400">Please approve in your wallet</p>
                    </div>
                `;
                
                try {
                    await this.phantomWallet.connectWallet();
                    console.log('Connecting to Phantom wallet');
                } catch (error) {
                    phantomBtn.disabled = false;
                    phantomBtn.innerHTML = `
                        <span class="text-2xl">👻</span>
                        <div class="text-left">
                            <p class="font-semibold text-white">Phantom</p>
                            <p class="text-sm text-gray-400">Connect your Phantom wallet</p>
                        </div>
                    `;
                }
            });
        }
    }

    /**
     * Update wallet status display
     */
    updateWalletStatus(data) {
        const walletStatus = document.getElementById('walletStatus');
        const walletName = document.getElementById('connectedWalletName');
        const walletAddress = document.getElementById('connectedWalletAddress');
        
        if (data) {
            walletName.textContent = data.walletName;
            walletAddress.textContent = this.phantomWallet.getShortAddress();
            walletStatus.classList.remove('hidden');
        } else {
            walletStatus.classList.add('hidden');
        }
    }

    /**
     * Update balance display in main UI
     */
    updateBalanceDisplay(balance) {
        const balanceMain = document.getElementById('balanceMain');
        const balanceCrypto = document.getElementById('balanceCrypto');
        
        if (balanceMain) {
            // Convert SOL to USD (mock conversion rate)
            const usdRate = 100; // Mock rate: 1 SOL = $100
            const usdBalance = (balance * usdRate).toFixed(2);
            balanceMain.textContent = `$${usdBalance}`;
        }
        
        if (balanceCrypto) {
            balanceCrypto.textContent = `${balance.toFixed(4)} SOL`;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('walletError');
        const errorMessage = document.getElementById('walletErrorMessage');
        
        if (errorDiv && errorMessage) {
            errorMessage.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorDiv = document.getElementById('walletError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    /**
     * Update main wallet UI buttons
     */
    updateMainWalletUI() {
        const addFundsBtn = document.getElementById('addFunds');
        const cashOutBtn = document.getElementById('cashOut');
        const copyAddressBtn = document.getElementById('copyAddress');
        const refreshBalanceBtn = document.getElementById('refreshBalance');
        
        if (this.phantomWallet.isConnected) {
            // Enable buttons when connected
            if (addFundsBtn) addFundsBtn.disabled = false;
            if (cashOutBtn) cashOutBtn.disabled = false;
            if (copyAddressBtn) copyAddressBtn.disabled = false;
            if (refreshBalanceBtn) refreshBalanceBtn.disabled = false;
        } else {
            // Disable buttons when not connected
            if (addFundsBtn) addFundsBtn.disabled = true;
            if (cashOutBtn) cashOutBtn.disabled = true;
            if (copyAddressBtn) copyAddressBtn.disabled = true;
            if (refreshBalanceBtn) refreshBalanceBtn.disabled = true;
        }
    }

    /**
     * Open transaction modal
     */
    openTransactionModal() {
        if (this.transactionModal) {
            this.transactionModal.openModal();
        } else {
            alert('Transaction modal not available');
        }
    }
}
