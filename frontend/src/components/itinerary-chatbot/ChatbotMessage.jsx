import React, { useState } from 'react'
import { User, ShoppingCart } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

const ChatbotMessage = ({ message }) => {
  const isUser = message.role === 'user'
  const isError = message.isError
  const { addToCart, cartItems } = useCart()
  const [loadingScheduleIds, setLoadingScheduleIds] = useState([])
  const [addedScheduleIds, setAddedScheduleIds] = useState([])

  // Helper function to check if a schedule is already in cart
  const isScheduleInCart = (scheduleId) => {
    return cartItems.some((item) => item.scheduleId === scheduleId)
  }

  // Handle Add to Cart button click
  const handleAddToCart = async (scheduleId) => {
    setLoadingScheduleIds((prev) => [...prev, scheduleId])
    try {
      const success = await addToCart(scheduleId, 1) // Default to 1 participant
      if (success) {
        // Mark as added
        setAddedScheduleIds((prev) => [...prev, scheduleId])
        console.log(`Successfully added schedule ${scheduleId} to cart`)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setLoadingScheduleIds((prev) => prev.filter((id) => id !== scheduleId))
    }
  }

  // Parse inline markdown (bold text, links, and Add to Cart buttons)
  const parseInlineMarkdown = (text) => {
    const elements = []
    let currentIndex = 0

    // Combined regex to match **[text](url)** bold links, [text](url) links, **bold** text, and {{ADD_TO_CART:scheduleId}}
    const boldLinkRegex = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g  // **[text](url)**
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g              // [text](url)
    const boldRegex = /\*\*([^*]+)\*\*/g                      // **text**
    const addToCartRegex = /\{\{ADD_TO_CART:(\d+)\}\}/g       // {{ADD_TO_CART:id}}

    // Find all matches for bold links, links, bold, and add to cart buttons
    const matches = []
    let match

    // Check for bold links first (most specific pattern)
    while ((match = boldLinkRegex.exec(text)) !== null) {
      matches.push({ type: 'boldLink', index: match.index, length: match[0].length, text: match[1], url: match[2] })
    }

    while ((match = linkRegex.exec(text)) !== null) {
      // Skip if this link is already part of a bold link
      const isPartOfBoldLink = matches.some(
        (m) => m.type === 'boldLink' && match.index >= m.index && match.index < m.index + m.length
      )
      if (!isPartOfBoldLink) {
        matches.push({ type: 'link', index: match.index, length: match[0].length, text: match[1], url: match[2] })
      }
    }

    while ((match = boldRegex.exec(text)) !== null) {
      // Skip if this bold is already part of a bold link
      const isPartOfBoldLink = matches.some(
        (m) => m.type === 'boldLink' && match.index >= m.index && match.index < m.index + m.length
      )
      if (!isPartOfBoldLink) {
        matches.push({ type: 'bold', index: match.index, length: match[0].length, text: match[1] })
      }
    }

    while ((match = addToCartRegex.exec(text)) !== null) {
      matches.push({ type: 'addToCart', index: match.index, length: match[0].length, scheduleId: parseInt(match[1]) })
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index)

    // Build elements array
    matches.forEach((match, i) => {
      // Add text before this match
      if (match.index > currentIndex) {
        elements.push(text.substring(currentIndex, match.index))
      }

      // Add the matched element
      if (match.type === 'boldLink') {
        elements.push(
          <a
            key={`boldlink-${i}`}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-1 hover:underline font-bold"
          >
            {match.text}
          </a>
        )
      } else if (match.type === 'link') {
        elements.push(
          <a
            key={`link-${i}`}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-1 hover:underline font-medium"
          >
            {match.text}
          </a>
        )
      } else if (match.type === 'bold') {
        elements.push(<strong key={`bold-${i}`}>{match.text}</strong>)
      } else if (match.type === 'addToCart') {
        const isLoading = loadingScheduleIds.includes(match.scheduleId)
        const isAdded = addedScheduleIds.includes(match.scheduleId) || isScheduleInCart(match.scheduleId)

        elements.push(
          <button
            key={`cart-${i}`}
            onClick={() => handleAddToCart(match.scheduleId)}
            disabled={isLoading || isAdded}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isAdded
                ? 'bg-neutrals-5 text-neutrals-3 cursor-default'
                : 'bg-primary-1 text-white hover:bg-primary-2 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {isLoading ? 'Adding...' : isAdded ? 'Added to Cart' : 'Add to Cart'}
          </button>
        )
      }

      currentIndex = match.index + match.length
    })

    // Add remaining text
    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex))
    }

    return elements.length > 0 ? elements : text
  }

  const formatContent = (content) => {
    // Handle undefined or null content
    if (!content) {
      return <p>No content</p>
    }

    // Split content by lines
    const lines = content.split('\n')

    return lines.map((line, index) => {
      // Check if line is a heading (starts with ###, ##, or #)
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-neutrals-1">
            {line.substring(4)}
          </h3>
        )
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-semibold mt-4 mb-2 text-neutrals-1">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-2 text-neutrals-1">
            {line.substring(2)}
          </h1>
        )
      }
      // Check if line is a bullet point
      else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-4">
            {line.trim().substring(2)}
          </li>
        )
      }
      // Check if line contains markdown links, bold text, or Add to Cart buttons
      else if (line.includes('**') || line.includes('](') || line.includes('{{ADD_TO_CART:')) {
        return (
          <p key={index} className="mb-2">
            {parseInlineMarkdown(line)}
          </p>
        )
      }
      // Regular paragraph
      else if (line.trim()) {
        return (
          <p key={index} className="mb-2">
            {line}
          </p>
        )
      }
      // Empty line
      else {
        return <br key={index} />
      }
    })
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 bg-primary-1 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] ml-auto">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className="w-8 h-8 bg-neutrals-4 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${isError ? 'bg-red-500' : 'bg-primary-1'} rounded-full flex items-center justify-center flex-shrink-0`}>
        {isError ? (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        )}
      </div>
      <div className={`flex-1 ${isError ? 'bg-red-50 border border-red-200' : 'bg-neutrals-7'} rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]`}>
        <div className={`text-sm ${isError ? 'text-red-700' : 'text-neutrals-2'} whitespace-pre-wrap break-words`}>
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  )
}

export default ChatbotMessage
