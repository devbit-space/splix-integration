/**
 * Phantom Wallet Integration for Splix Game
 * Handles Phantom wallet connection and basic operations
 */

export class PhantomWalletManager {
    constructor() {
        this.wallet = null;
        this.publicKey = null;
        this.isConnected = false;
        this.balance = 0;
        this.listeners = new Map();
        
        this.init();
    }

    init() {
        // Check if Phantom is available
        this.checkPhantomAvailability();
        
        // Set up global Phantom event listeners
        this.setupGlobalListeners();
    }

    /**
     * Check if Phantom wallet is available
     */
    checkPhantomAvailability() {
        if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
            this.wallet = window.solana;
            console.log('Phantom wallet detected');
            return true;
        } else {
            console.log('Phantom wallet not detected');
            return false;
        }
    }

    /**
     * Connect to Phantom wallet
     */
    async connectWallet() {
        try {
            if (!this.wallet) {
                throw new Error('Phantom wallet not found. Please install Phantom wallet extension.');
            }

            // Request connection
            const response = await this.wallet.connect();
            
            if (response && response.publicKey) {
                this.publicKey = response.publicKey;
                this.isConnected = true;
                
                // Get initial balance
                await this.updateBalance();
                
                this.emit('connected', {
                    publicKey: this.publicKey.toString(),
                    walletName: 'Phantom'
                });
                
                console.log('Phantom wallet connected:', this.publicKey.toString());
                return true;
            } else {
                throw new Error('Failed to connect to Phantom wallet');
            }
        } catch (error) {
            console.error('Phantom connection failed:', error);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Disconnect from Phantom wallet
     */
    async disconnectWallet() {
        try {
            if (this.wallet && this.wallet.disconnect) {
                await this.wallet.disconnect();
            }
            
            this.publicKey = null;
            this.isConnected = false;
            this.balance = 0;
            
            this.emit('disconnected');
            console.log('Phantom wallet disconnected');
        } catch (error) {
            console.error('Phantom disconnection failed:', error);
        }
    }

    /**
     * Update wallet balance
     */
    async updateBalance() {
        if (!this.publicKey || !this.wallet) {
            return 0;
        }

        try {
            // Use Phantom's getBalance method
            const balance = await this.wallet.getBalance();
            this.balance = balance / 1000000000; // Convert lamports to SOL
            
            this.emit('balanceUpdated', this.balance);
            return this.balance;
        } catch (error) {
            console.error('Failed to update balance:', error);
            this.emit('error', error);
            return 0;
        }
    }

    /**
     * Send SOL transaction
     */
    async sendTransaction(toAddress, amountSOL) {
        if (!this.isConnected || !this.publicKey) {
            throw new Error('Wallet not connected');
        }

        try {
            // Create transaction using Phantom's methods
            const transaction = await this.wallet.request({
                method: 'sol_transfer',
                params: {
                    to: toAddress,
                    amount: amountSOL * 1000000000, // Convert SOL to lamports
                }
            });

            // Update balance after successful transaction
            await this.updateBalance();

            this.emit('transactionSent', {
                signature: transaction.signature,
                to: toAddress,
                amount: amountSOL
            });

            return transaction.signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Get wallet address (shortened for display)
     */
    getShortAddress() {
        if (!this.publicKey) return '';
        
        const address = this.publicKey.toString();
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    /**
     * Get full wallet address
     */
    getFullAddress() {
        return this.publicKey ? this.publicKey.toString() : '';
    }

    /**
     * Set up global Phantom event listeners
     */
    setupGlobalListeners() {
        if (!this.wallet) return;

        // Listen for account changes
        this.wallet.on('accountChanged', (publicKey) => {
            if (publicKey) {
                this.publicKey = publicKey;
                this.updateBalance();
            } else {
                this.disconnectWallet();
            }
        });

        this.wallet.on('disconnect', () => {
            this.disconnectWallet();
        });
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}

// Create global instance
export const phantomWallet = new PhantomWalletManager();
