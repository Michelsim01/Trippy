import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cartService } from '../services/cartService'
import { useAuth } from './AuthContext'

// Create the CartContext
const CartContext = createContext()

// Custom hook to use the CartContext
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// CartProvider component
export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()

  // Cart state
  const [cartItems, setCartItems] = useState([])
  const [selectedItemIds, setSelectedItemIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false)

  // Computed values
  const cartCount = cartItems.length
  const selectedCount = selectedItemIds.length

  // Calculate subtotal of selected items
  const subtotal = cartItems
    .filter((item) => selectedItemIds.includes(item.cartItemId))
    .reduce((sum, item) => {
      const itemTotal = Number(item.currentPrice) * Number(item.numberOfParticipants)
      return sum + itemTotal
    }, 0)

  // Calculate service fee (4% of subtotal)
  const serviceFee = subtotal * 0.04

  // Calculate total (subtotal + service fee)
  const total = subtotal + serviceFee

  // Load cart on mount if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCart()
    } else {
      // Clear cart if user logs out
      setCartItems([])
      setSelectedItemIds([])
    }
  }, [isAuthenticated, user?.id])

  /**
   * Refresh cart data from backend
   */
  const refreshCart = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const response = await cartService.getUserCart(user.id)

      if (response.success) {
        setCartItems(response.data.cartItems || [])
        // Keep only selected items that still exist in cart
        setSelectedItemIds((prev) =>
          prev.filter((id) =>
            (response.data.cartItems || []).some((item) => item.cartItemId === id)
          )
        )
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to load cart')
      console.error('Error refreshing cart:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  /**
   * Add an item to the cart
   * @param {number} scheduleId - Experience schedule ID
   * @param {number} numberOfParticipants - Number of participants
   * @returns {Promise<boolean>} Success status
   */
  const addToCart = async (scheduleId, numberOfParticipants) => {
    if (!user?.id) {
      setError('You must be logged in to add items to cart')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      const response = await cartService.addToCart(user.id, scheduleId, numberOfParticipants)

      if (response.success) {
        // Refresh cart to get updated data
        await refreshCart()
        return true
      } else {
        setError(response.error)
        return false
      }
    } catch (err) {
      setError('Failed to add item to cart')
      console.error('Error adding to cart:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Remove an item from the cart
   * @param {number} cartItemId - Cart item ID
   * @returns {Promise<boolean>} Success status
   */
  const removeFromCart = async (cartItemId) => {
    if (!user?.id) return false

    try {
      setLoading(true)
      setError(null)
      const response = await cartService.removeCartItem(cartItemId, user.id)

      if (response.success) {
        // Remove from selected items if present
        setSelectedItemIds((prev) => prev.filter((id) => id !== cartItemId))
        // Refresh cart
        await refreshCart()
        return true
      } else {
        setError(response.error)
        return false
      }
    } catch (err) {
      setError('Failed to remove item from cart')
      console.error('Error removing from cart:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update the number of participants for a cart item
   * @param {number} cartItemId - Cart item ID
   * @param {number} numberOfParticipants - New number of participants
   * @returns {Promise<boolean>} Success status
   */
  const updateParticipants = async (cartItemId, numberOfParticipants) => {
    if (!user?.id) return false
    if (numberOfParticipants < 1) return false

    try {
      // Optimistic update
      setCartItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? {
                ...item,
                numberOfParticipants,
                totalPrice: Number(item.priceAtTimeOfAdd) * numberOfParticipants,
              }
            : item
        )
      )

      const response = await cartService.updateCartItem(cartItemId, user.id, numberOfParticipants)

      if (response.success) {
        // Refresh to get accurate data from backend
        await refreshCart()
        return true
      } else {
        // Revert optimistic update on failure
        await refreshCart()
        setError(response.error)
        return false
      }
    } catch (err) {
      // Revert optimistic update on error
      await refreshCart()
      setError('Failed to update cart item')
      console.error('Error updating cart item:', err)
      return false
    }
  }

  /**
   * Toggle selection of a cart item
   * @param {number} cartItemId - Cart item ID
   */
  const toggleItemSelection = (cartItemId) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(cartItemId)) {
        return prev.filter((id) => id !== cartItemId)
      } else {
        return [...prev, cartItemId]
      }
    })
  }

  /**
   * Clear all items from the cart
   * @returns {Promise<boolean>} Success status
   */
  const clearCart = async () => {
    if (!user?.id) return false

    try {
      setLoading(true)
      setError(null)
      const response = await cartService.clearCart(user.id)

      if (response.success) {
        setCartItems([])
        setSelectedItemIds([])
        return true
      } else {
        setError(response.error)
        return false
      }
    } catch (err) {
      setError('Failed to clear cart')
      console.error('Error clearing cart:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const value = {
    // State
    cartItems,
    selectedItemIds,
    loading,
    error,
    cartSidebarOpen,
    setCartSidebarOpen,

    // Computed values
    cartCount,
    selectedCount,
    subtotal,
    serviceFee,
    total,

    // Methods
    addToCart,
    removeFromCart,
    updateParticipants,
    toggleItemSelection,
    clearCart,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartContext
