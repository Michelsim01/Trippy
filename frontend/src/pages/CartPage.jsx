import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import CartItemCard from '../components/cart/CartItemCard'

const CartPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const {
    cartItems,
    selectedItemIds,
    cartCount,
    selectedCount,
    subtotal,
    serviceFee,
    total,
    loading,
    refreshCart,
  } = useCart()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin')
      return
    }
    refreshCart()
  }, [isAuthenticated, navigate, refreshCart])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutrals-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-[275px]' : 'w-0'} overflow-hidden`}>
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="desktop" />
        </div>

        <div className="flex-1 w-full transition-all duration-300">
          <Navbar
            isAuthenticated={isAuthenticated}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
          />

          {/* Main Content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-neutrals-2 mb-2">Shopping Cart</h1>
              <p className="text-neutrals-4">
                {cartCount === 0
                  ? 'Your cart is empty'
                  : `${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart`}
              </p>
            </div>

            {loading ? (
              /* Loading State */
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-1 mx-auto mb-4"></div>
                  <p className="text-neutrals-4">Loading your cart...</p>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <ShoppingCart className="w-20 h-20 text-neutrals-4 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-neutrals-2 mb-2">Your cart is empty</h2>
                <p className="text-neutrals-4 mb-6">
                  Start adding experiences to your cart to book amazing adventures!
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="px-8 py-3 bg-primary-1 text-white rounded-full font-bold hover:bg-opacity-90 transition-colors"
                >
                  Browse Experiences
                </button>
              </div>
            ) : (
              /* Cart Items */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items List - Takes 2 columns on large screens */}
                <div className="lg:col-span-2 space-y-4">
                  {cartItems.map((item) => (
                    <CartItemCard key={item.cartItemId} item={item} />
                  ))}
                </div>

                {/* Summary Card - Takes 1 column, sticky on large screens */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                    <h2 className="text-xl font-bold text-neutrals-2 mb-4">Order Summary</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-neutrals-3">
                        <span>Total Items:</span>
                        <span className="font-semibold">{cartCount}</span>
                      </div>
                      <div className="flex justify-between text-neutrals-3">
                        <span>Selected Items:</span>
                        <span className="font-semibold">{selectedCount}</span>
                      </div>

                      {/* Price Breakdown */}
                      {selectedCount > 0 && (
                        <>
                          <div className="border-t border-neutrals-6 pt-3">
                            <div className="flex justify-between text-neutrals-3 mb-2">
                              <span>Subtotal:</span>
                              <span className="font-semibold">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-neutrals-3 mb-3">
                              <span>Service fee (4%):</span>
                              <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="border-t border-neutrals-6 pt-3 flex justify-between">
                            <span className="text-lg font-bold text-neutrals-2">Total:</span>
                            <span className="text-2xl font-bold text-primary-1">
                              ${total.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {selectedCount === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-neutrals-4 mb-3">
                          Select items to see your subtotal
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-neutrals-4 mb-4">
                          Subtotal includes {selectedCount} selected{' '}
                          {selectedCount === 1 ? 'item' : 'items'}
                        </p>
                        <button
                          onClick={() => navigate(`/checkout/bulk/contact?cartItemIds=${selectedItemIds.join(',')}`)}
                          className="w-full py-3 bg-primary-1 text-white rounded-full font-bold hover:opacity-90 transition-opacity"
                        >
                          Checkout Now
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => navigate('/home')}
                      className="w-full mt-3 py-3 border-2 border-primary-1 text-primary-1 rounded-full font-bold hover:bg-primary-1 hover:text-white transition-colors"
                    >
                      Continue Shopping
                    </button>

                    <p className="text-xs text-center text-neutrals-4 mt-4">
                      Service fees will be calculated at checkout
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Footer />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <Navbar
          isAuthenticated={isAuthenticated}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} variant="mobile" />

        {/* Main Content */}
        <main className="w-full">
          <div className="px-4 sm:px-6 py-8 mt-20">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-neutrals-2 mb-2">Shopping Cart</h1>
              <p className="text-neutrals-4">
                {cartCount === 0
                  ? 'Your cart is empty'
                  : `${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart`}
              </p>
            </div>

            {loading ? (
              /* Loading State */
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-1 mx-auto mb-4"></div>
                  <p className="text-neutrals-4">Loading your cart...</p>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <ShoppingCart className="w-20 h-20 text-neutrals-4 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-neutrals-2 mb-2">Your cart is empty</h2>
                <p className="text-neutrals-4 mb-6">
                  Start adding experiences to your cart to book amazing adventures!
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="px-8 py-3 bg-primary-1 text-white rounded-full font-bold hover:bg-opacity-90 transition-colors"
                >
                  Browse Experiences
                </button>
              </div>
            ) : (
              /* Cart Items */
              <div className="space-y-4">
                {/* Items List */}
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItemCard key={item.cartItemId} item={item} />
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-neutrals-2 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-neutrals-3">
                      <span>Total Items:</span>
                      <span className="font-semibold">{cartCount}</span>
                    </div>
                    <div className="flex justify-between text-neutrals-3">
                      <span>Selected Items:</span>
                      <span className="font-semibold">{selectedCount}</span>
                    </div>

                    {/* Price Breakdown */}
                    {selectedCount > 0 && (
                      <>
                        <div className="border-t border-neutrals-6 pt-3">
                          <div className="flex justify-between text-neutrals-3 mb-2">
                            <span>Subtotal:</span>
                            <span className="font-semibold">${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-neutrals-3 mb-3">
                            <span>Service fee (4%):</span>
                            <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="border-t border-neutrals-6 pt-3 flex justify-between">
                          <span className="text-lg font-bold text-neutrals-2">Total:</span>
                          <span className="text-2xl font-bold text-primary-1">
                            ${total.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedCount === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-neutrals-4 mb-3">
                        Select items to see your subtotal
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-neutrals-4 mb-4">
                        Subtotal includes {selectedCount} selected{' '}
                        {selectedCount === 1 ? 'item' : 'items'}
                      </p>
                      <button
                        onClick={() => navigate(`/checkout/bulk/contact?cartItemIds=${selectedItemIds.join(',')}`)}
                        className="w-full py-3 bg-primary-1 text-white rounded-full font-bold hover:opacity-90 transition-opacity"
                      >
                        Checkout Now
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => navigate('/home')}
                    className="w-full mt-3 py-3 border-2 border-primary-1 text-primary-1 rounded-full font-bold hover:bg-primary-1 hover:text-white transition-colors"
                  >
                    Continue Shopping
                  </button>

                  <p className="text-xs text-center text-neutrals-4 mt-4">
                    Service fees will be calculated at checkout
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default CartPage
