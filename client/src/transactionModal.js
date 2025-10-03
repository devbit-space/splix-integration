/**
 * Simple Transaction Modal for Phantom Wallet
 * Handles sending SOL transactions
 */

export class TransactionModal {
    constructor(phantomWallet) {
        this.phantomWallet = phantomWallet;
        this.modal = null;
        this.isModalOpen = false;
        
        this.init();
    }

    init() {
        this.createTransactionModal();
        this.setupEventListeners();
    }

    /**
     * Create transaction modal
     */
    createTransactionModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'transactionModalOverlay';
        modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'fixed inset-0 flex items-center justify-center p-4';
        
        const modalCard = document.createElement('div');
        modalCard.className = 'bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4';
        
        modalCard.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">Send SOL</h2>
                <button id="closeTransactionModal" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                    <input 
                        type="text" 
                        id="recipientAddress" 
                        placeholder="Enter Solana address..."
                        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Amount (SOL)</label>
                    <div class="relative">
                        <input 
                            type="number" 
                            id="amountSOL" 
                            step="0.0001"
                            min="0"
                            placeholder="0.0000"
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                        />
                        <div class="absolute right-3 top-2 text-gray-400 text-sm">SOL</div>
                    </div>
                </div>
                
                <div class="flex justify-between text-sm text-gray-400">
                    <span>Available Balance:</span>
                    <span id="availableBalance">0.0000 SOL</span>
                </div>
                
                <div class="flex gap-3 pt-4">
                    <button 
                        id="sendTransactionBtn" 
                        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        <span class="flex items-center justify-center gap-2">
                            <i data-lucide="send" class="w-4 h-4"></i>
                            Send Transaction
                        </span>
                    </button>
                    <button 
                        id="cancelTransactionBtn" 
                        class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            
            <div id="transactionStatus" class="mt-4 p-3 rounded-lg hidden">
                <div id="transactionLoading" class="flex items-center gap-2 text-blue-400">
                    <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
                    <span>Processing transaction...</span>
                </div>
                <div id="transactionSuccess" class="flex items-center gap-2 text-green-400 hidden">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    <span>Transaction successful!</span>
                </div>
                <div id="transactionError" class="flex items-center gap-2 text-red-400 hidden">
                    <i data-lucide="x-circle" class="w-4 h-4"></i>
                    <span id="transactionErrorMessage">Transaction failed</span>
                </div>
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
        const closeBtn = document.getElementById('closeTransactionModal');
        const cancelBtn = document.getElementById('cancelTransactionBtn');
        const overlay = document.getElementById('transactionModalOverlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal();
                }
            });
        }

        // Form validation
        const recipientInput = document.getElementById('recipientAddress');
        const amountInput = document.getElementById('amountSOL');
        const sendBtn = document.getElementById('sendTransactionBtn');

        if (recipientInput && amountInput && sendBtn) {
            const validateForm = () => {
                const recipient = recipientInput.value.trim();
                const amount = parseFloat(amountInput.value);
                const isValidAddress = this.isValidSolanaAddress(recipient);
                const isValidAmount = amount > 0 && amount <= this.phantomWallet.balance;
                
                sendBtn.disabled = !(isValidAddress && isValidAmount);
            };

            recipientInput.addEventListener('input', validateForm);
            amountInput.addEventListener('input', validateForm);

            // Send transaction
            sendBtn.addEventListener('click', () => {
                this.sendTransaction();
            });
        }
    }

    /**
     * Open transaction modal
     */
    openModal() {
        if (!this.phantomWallet.isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        this.updateAvailableBalance();
        this.resetForm();
        this.modal.classList.remove('hidden');
        this.isModalOpen = true;
        
        // Recreate icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /**
     * Close transaction modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
        this.isModalOpen = false;
        this.resetForm();
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        const recipientInput = document.getElementById('recipientAddress');
        const amountInput = document.getElementById('amountSOL');
        const statusDiv = document.getElementById('transactionStatus');
        
        if (recipientInput) recipientInput.value = '';
        if (amountInput) amountInput.value = '';
        if (statusDiv) statusDiv.classList.add('hidden');
        
        this.hideAllStatusMessages();
    }

    /**
     * Update available balance display
     */
    updateAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        if (balanceElement && this.phantomWallet.balance !== undefined) {
            balanceElement.textContent = `${this.phantomWallet.balance.toFixed(4)} SOL`;
        }
    }

    /**
     * Send transaction
     */
    async sendTransaction() {
        const recipientInput = document.getElementById('recipientAddress');
        const amountInput = document.getElementById('amountSOL');
        const sendBtn = document.getElementById('sendTransactionBtn');
        
        if (!recipientInput || !amountInput || !sendBtn) return;

        const recipient = recipientInput.value.trim();
        const amount = parseFloat(amountInput.value);

        if (!this.isValidSolanaAddress(recipient)) {
            this.showError('Invalid Solana address');
            return;
        }

        if (amount <= 0 || amount > this.phantomWallet.balance) {
            this.showError('Invalid amount');
            return;
        }

        // Show loading state
        sendBtn.disabled = true;
        this.showLoading();

        try {
            const signature = await this.phantomWallet.sendTransaction(recipient, amount);
            this.showSuccess(`Transaction sent! Signature: ${signature.slice(0, 8)}...`);
            
            // Close modal after success
            setTimeout(() => {
                this.closeModal();
            }, 2000);
            
        } catch (error) {
            console.error('Transaction failed:', error);
            this.showError(error.message || 'Transaction failed');
        } finally {
            sendBtn.disabled = false;
        }
    }

    /**
     * Validate Solana address
     */
    isValidSolanaAddress(address) {
        try {
            // Basic validation - Solana addresses are base58 encoded and 32-44 characters
            const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
            return base58Regex.test(address);
        } catch {
            return false;
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStatusMessages();
        const statusDiv = document.getElementById('transactionStatus');
        const loadingDiv = document.getElementById('transactionLoading');
        
        if (statusDiv && loadingDiv) {
            statusDiv.classList.remove('hidden');
            loadingDiv.classList.remove('hidden');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.hideAllStatusMessages();
        const statusDiv = document.getElementById('transactionStatus');
        const successDiv = document.getElementById('transactionSuccess');
        
        if (statusDiv && successDiv) {
            statusDiv.classList.remove('hidden');
            successDiv.classList.remove('hidden');
            successDiv.querySelector('span').textContent = message;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideAllStatusMessages();
        const statusDiv = document.getElementById('transactionStatus');
        const errorDiv = document.getElementById('transactionError');
        const errorMessage = document.getElementById('transactionErrorMessage');
        
        if (statusDiv && errorDiv && errorMessage) {
            statusDiv.classList.remove('hidden');
            errorDiv.classList.remove('hidden');
            errorMessage.textContent = message;
        }
    }

    /**
     * Hide all status messages
     */
    hideAllStatusMessages() {
        const loadingDiv = document.getElementById('transactionLoading');
        const successDiv = document.getElementById('transactionSuccess');
        const errorDiv = document.getElementById('transactionError');
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        if (successDiv) successDiv.classList.add('hidden');
        if (errorDiv) errorDiv.classList.add('hidden');
    }
}
