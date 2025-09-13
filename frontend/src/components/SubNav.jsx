const SubNav = ({ status = "inactive", text, text1, onClick, className = "" }) => {
    const displayText = text || text1;
    const isActive = status === "active";
    
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full transition-colors ${
                isActive
                    ? "bg-neutrals-1 text-white"
                    : "bg-transparent text-neutrals-4 hover:text-neutrals-2"
            } ${className}`}
        >
            <span className="text-[14px] font-bold whitespace-nowrap">
                {displayText}
            </span>
        </button>
    );
};

export default SubNav;