import React from 'react'
import { Link } from 'react-router-dom'
import { Trash2, AlertCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

const CartItemCard = ({ item }) => {
  const { selectedItemIds, toggleItemSelection, updateParticipants, removeFromCart } = useCart()

  const isSelected = selectedItemIds.includes(item.cartItemId)
  const isUnavailable = !item.isAvailable || item.isCancelled || item.availableSpots < item.numberOfParticipants

  const handleUpdateParticipants = async (newCount) => {
    if (newCount < 1) return
    if (newCount > item.availableSpots) {
      alert(`Only ${item.availableSpots} spots available for this schedule`)
      return
    }
    await updateParticipants(item.cartItemId, newCount)
  }

  const handleRemove = async () => {
    if (window.confirm('Remove this item from your cart?')) {
      await removeFromCart(item.cartItemId)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className={`border rounded-lg p-4 ${isSelected ? 'border-green-500 bg-green-50' : 'border-neutrals-6 bg-white'} transition-colors`}>
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex items-start pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleItemSelection(item.cartItemId)}
            disabled={isUnavailable}
            className="w-5 h-5 border-neutrals-5 rounded focus:ring-primary-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ accentColor: 'var(--color-primary-1)' }}
          />
        </div>

        {/* Thumbnail - Clickable */}
        <Link
          to={`/experience/${item.experienceId}`}
          className="w-24 h-24 flex-shrink-0 group"
        >
          <img
            src={item.coverPhotoUrl || 'https://via.placeholder.com/150'}
            alt={item.experienceTitle}
            className="w-full h-full object-cover rounded-lg cursor-pointer transition-opacity group-hover:opacity-80"
          />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutrals-2 mb-1 truncate">
            {item.experienceTitle}
          </h3>
          <p className="text-sm text-neutrals-4 mb-2">
            {formatDate(item.startDateTime)} • {formatTime(item.startDateTime)}
          </p>
          {item.location && (
            <p className="text-xs text-neutrals-4 mb-2">{item.location}</p>
          )}

          {/* Participant Counter */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-neutrals-3">Participants:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateParticipants(item.numberOfParticipants - 1)}
                disabled={item.numberOfParticipants <= 1}
                className="w-7 h-7 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="font-semibold text-neutrals-2 w-8 text-center">
                {item.numberOfParticipants}
              </span>
              <button
                onClick={() => handleUpdateParticipants(item.numberOfParticipants + 1)}
                disabled={item.numberOfParticipants >= item.availableSpots}
                className="w-7 h-7 rounded-full border border-neutrals-5 flex items-center justify-center hover:bg-neutrals-7 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="mt-2">
            <p className="text-lg font-bold text-neutrals-2">
              ${(item.currentPrice * item.numberOfParticipants).toFixed(2)}
            </p>
            <p className="text-xs text-neutrals-4">
              ${item.currentPrice.toFixed(2)} × {item.numberOfParticipants}
            </p>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors h-fit"
          title="Remove from cart"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Warning if unavailable */}
      {isUnavailable && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">
            {item.isCancelled
              ? 'This schedule has been cancelled'
              : !item.isAvailable
              ? 'This schedule is no longer available'
              : 'Not enough spots available for your party size'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CartItemCard
