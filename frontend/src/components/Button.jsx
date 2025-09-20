import React from 'react'

const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    type = 'button',
    className = '',
    ...props 
}) => {
    const baseClasses = 'font-dm-sans font-bold rounded-[90px] transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
        primary: 'bg-primary-1 text-neutrals-8 hover:bg-primary-1/90 focus:ring-primary-1',
        secondary: 'border-2 border-neutrals-6 text-neutrals-2 hover:bg-neutrals-7 focus:ring-neutrals-6',
        outline: 'border-2 border-primary-1 text-primary-1 hover:bg-primary-1 hover:text-neutrals-8 focus:ring-primary-1',
        ghost: 'text-neutrals-2 hover:bg-neutrals-7 focus:ring-neutrals-6'
    }
    
    const sizes = {
        sm: 'text-xs leading-3 px-3 py-2',
        md: 'text-sm leading-4 px-4 py-3',
        lg: 'text-base leading-5 px-6 py-4',
        xl: 'text-lg leading-6 px-8 py-5'
    }
    
    const disabledClasses = 'opacity-50 cursor-not-allowed transform-none hover:scale-100 active:scale-100'
    
    const buttonClasses = `
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? disabledClasses : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ')
    
    return (
        <button
            type={type}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={buttonClasses}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button