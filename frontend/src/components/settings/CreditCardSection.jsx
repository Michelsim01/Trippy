import React from 'react';

const CreditCardSection = ({ showAddCard, toggleAddCard }) => (
    <div id="credit-card" className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-primary-1 rounded-full"></div>
            <h2 className="text-xl font-semibold text-neutrals-1">Credit card</h2>
        </div>
        <div className="space-y-4">
            {/* Example card, you can map over cards if needed */}
            <div className="bg-neutrals-7 rounded-lg p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-medium text-neutrals-1">Visa ••••••1667</p>
                        <p className="text-sm text-neutrals-4">Expiration: 03/2026</p>
                    </div>
                    <button className="text-neutrals-4 hover:text-neutrals-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            {showAddCard && (
                <div className="border-2 border-dashed border-primary-4 rounded-lg p-6 bg-blue-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-neutrals-1">Add new credit card</h3>
                        <div className="flex gap-2">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPgo8cGF0aCBkPSJNMTYuNCA5LjJIMTguNFYxNC44SDE2LjRWOS4yWiIgZmlsbD0id2hpdGUiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTMuNCAxMi4ySDExLjRWMTAuMkg5LjRWMTIuMkg3LjRWMTQuMkg5LjRWMTYuMkgxMS40VjE0LjJIMTMuNFYxMi4yWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==" alt="Visa" className="h-6" />
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0VCMDAxQiIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjEyIiByPSI2IiBmaWxsPSIjRkY1RjAwIi8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMTIiIHI9IjYiIGZpbGw9IiNGRjVGMDAiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjEyIiByPSI0IiBmaWxsPSIjRkY1RjAwIi8+Cjwvc3ZnPgo=" alt="Mastercard" className="h-6" />
                        </div>
                    </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="field-label" htmlFor="cardNumber">
                                    Card Number
                                </label>
                                <input
                                    id="cardNumber"
                                    type="text"
                                    className="input-field white"
                                    placeholder="9224 6666 2236 8888"
                                />
                            </div>
                            <div>
                                <label className="field-label" htmlFor="cardHolder">
                                    Card Holder
                                </label>
                                <input
                                    id="cardHolder"
                                    type="text"
                                    className="input-field white"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="field-label" htmlFor="expDate">
                                    Expiration Date
                                </label>
                                <input
                                    id="expDate"
                                    type="text"
                                    className="input-field white"
                                    placeholder="MM/YY"
                                />
                            </div>
                            <div>
                                <label className="field-label" htmlFor="cvc">
                                    CVC
                                </label>
                                <input
                                    id="cvc"
                                    type="text"
                                    className="input-field white"
                                    placeholder="123"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn btn-primary btn-md" type="button">
                                Save
                            </button>
                            <button 
                                onClick={toggleAddCard}
                                className="btn btn-outline-primary btn-md"
                                type="button"
                            >
                                Cancel
                            </button>
                        </div>
                </div>
            )}
            {!showAddCard && (
                <button 
                    onClick={toggleAddCard}
                    className="w-full border-2 border-dashed border-neutrals-6 rounded-lg p-6 text-neutrals-4 hover:border-neutrals-4 hover:text-neutrals-3 transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add payment method
                </button>
            )}
        </div>
    </div>
);

export default CreditCardSection;
