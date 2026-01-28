import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  isRangeMode = false,
  onToggleMode,
  placeholder = "Select date range",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const dropdownRef = useRef(null);

  // Parse the dates
  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for input value (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Get display text
  const getDisplayText = () => {
    if (!isRangeMode) {
      return startDateObj ? formatDate(startDateObj) : placeholder;
    }
    
    if (startDateObj && endDateObj) {
      return `${formatDate(startDateObj)} - ${formatDate(endDateObj)}`;
    } else if (startDateObj) {
      return `${formatDate(startDateObj)} - Select end date`;
    } else {
      return placeholder;
    }
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    const formattedDate = formatDateForInput(date);
    
    if (!isRangeMode) {
      onStartDateChange(formattedDate);
      setIsOpen(false);
      return;
    }

    if (selectingStart || !startDateObj) {
      onStartDateChange(formattedDate);
      onEndDateChange(''); // Clear end date when selecting new start
      setSelectingStart(false);
    } else {
      // If selecting end date and it's before start date, swap them
      if (date < startDateObj) {
        onStartDateChange(formattedDate);
        onEndDateChange(formatDateForInput(startDateObj));
      } else {
        onEndDateChange(formattedDate);
      }
      setSelectingStart(true);
      setIsOpen(false);
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setDisplayedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Check if date is in range
  const isInRange = (date) => {
    if (!date || !isRangeMode || !startDateObj || !endDateObj) return false;
    return date >= startDateObj && date <= endDateObj;
  };

  // Check if date is start or end
  const isStartDate = (date) => {
    if (!date || !startDateObj) return false;
    return date.toDateString() === startDateObj.toDateString();
  };

  const isEndDate = (date) => {
    if (!date || !endDateObj) return false;
    return date.toDateString() === endDateObj.toDateString();
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Quick date selections
  const quickDates = [
    { 
      label: 'Today', 
      action: () => {
        const today = formatDateForInput(new Date());
        onStartDateChange(today);
        if (isRangeMode) onEndDateChange(today);
        setIsOpen(false);
      }
    },
    { 
      label: 'Yesterday', 
      action: () => {
        const yesterday = formatDateForInput(new Date(Date.now() - 24 * 60 * 60 * 1000));
        onStartDateChange(yesterday);
        if (isRangeMode) onEndDateChange(yesterday);
        setIsOpen(false);
      }
    },
    { 
      label: 'Last 7 days', 
      action: () => {
        const today = formatDateForInput(new Date());
        const weekAgo = formatDateForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        onStartDateChange(weekAgo);
        onEndDateChange(today);
        setIsOpen(false);
      }
    },
    { 
      label: 'Last 30 days', 
      action: () => {
        const today = formatDateForInput(new Date());
        const monthAgo = formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        onStartDateChange(monthAgo);
        onEndDateChange(today);
        setIsOpen(false);
      }
    },
  ];

  const days = getDaysInMonth(displayedMonth);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={getDisplayText()}
          placeholder={placeholder}
          className={`w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'} ${className}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          readOnly
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg  p-3 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
              type="button"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {months[displayedMonth.getMonth()]} {displayedMonth.getFullYear()}
              </div>
            </div>

            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded text-gray-600"
              type="button"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Toggle */}
          {onToggleMode && (
            <div className="flex items-center justify-center mb-3">
              <button
                onClick={() => {
                  onToggleMode();
                  setSelectingStart(true);
                }}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                type="button"
              >
                <ArrowsRightLeftIcon className="w-3 h-3" />
                <span>{isRangeMode ? 'Single Date' : 'Date Range'}</span>
              </button>
            </div>
          )}

          {/* Range Selection Info */}
          {isRangeMode && (
            <div className="mb-2 text-center text-xs text-gray-600">
              {selectingStart ? 'Select start date' : 'Select end date'}
            </div>
          )}

          {/* Quick Date Buttons */}
          <div className="flex flex-wrap gap-1 mb-3">
            {quickDates.map((quick) => (
              <button
                key={quick.label}
                onClick={quick.action}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                type="button"
              >
                {quick.label}
              </button>
            ))}
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateSelect(date)}
                disabled={!date}
                className={`
                  w-7 h-7 text-xs rounded transition-colors flex items-center justify-center font-medium
                  ${!date ? 'invisible' : ''}
                  ${date ? 'hover:bg-indigo-100 cursor-pointer text-gray-700' : ''}
                  ${isStartDate(date) || isEndDate(date) 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : ''
                  }
                  ${isInRange(date) && !isStartDate(date) && !isEndDate(date)
                    ? 'bg-indigo-100 text-indigo-700' 
                    : ''
                  }
                  ${isToday(date) && !isStartDate(date) && !isEndDate(date) && !isInRange(date)
                    ? 'bg-gray-100 text-gray-900 font-bold' 
                    : ''
                  }
                `}
                type="button"
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
                setIsOpen(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
              type="button"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
