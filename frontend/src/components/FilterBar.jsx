import SubNav from './SubNav';
import AdditionalSortDropdown from './AdditionalSortDropdown';

const FilterBar = ({ currentSort, onSortChange, className = "" }) => {
    const sortOptions = [
        { value: 'cheapest', label: 'Cheapest' },
        { value: 'trustiest', label: 'Trustiest' },
        { value: 'quickest', label: 'Quickest' }
    ];

    const handleSortClick = (sortValue) => {
        // If clicking the active sort, don't change (or could toggle to bestMatch)
        if (currentSort === sortValue) {
            return;
        }
        onSortChange(sortValue);
    };

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <div className="flex items-center gap-2 overflow-x-auto">
                {sortOptions.map((option) => (
                    <SubNav
                        key={option.value}
                        status={currentSort === option.value ? "active" : "inactive"}
                        text={option.label}
                        onClick={() => handleSortClick(option.value)}
                        className="shrink-0"
                    />
                ))}
            </div>
            
            <AdditionalSortDropdown
                currentSort={currentSort}
                onSortChange={onSortChange}
                className="shrink-0"
            />
        </div>
    );
};

export default FilterBar;