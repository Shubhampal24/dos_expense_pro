import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CustomDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date",
  className = "",
  disabled = false,
  minDate = null,
  maxDate = null 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Parse the value to a Date object
  const selectedDate = value ? (() => {
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  })() : null;

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

  // Set displayed month when value changes
  useEffect(() => {
    if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate)) {
      const newMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      setDisplayedMonth(prev => {
        // Only update if the month/year actually changed
        if (prev.getMonth() !== newMonth.getMonth() || prev.getFullYear() !== newMonth.getFullYear()) {
          return newMonth;
        }
        return prev;
      });
    }
  }, [value]); // Use value instead of selectedDate to avoid dependency issues

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

  // Handle date selection
  const handleDateSelect = (date) => {
    const formattedDate = formatDateForInput(date);
    onChange(formattedDate);
    setIsOpen(false);
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setDisplayedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Check if date is disabled
  const isDateDisabled = (date) => {
    if (!date) return true;
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    return false;
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Quick date selections
  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { label: 'Last Week', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ];

  const days = getDaysInMonth(displayedMonth);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={formatDate(selectedDate)}
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

          {/* Quick Date Buttons */}
          <div className="flex gap-1 mb-3">
            {quickDates.map((quick) => (
              <button
                key={quick.label}
                onClick={() => handleDateSelect(quick.date)}
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
                onClick={() => date && !isDateDisabled(date) && handleDateSelect(date)}
                disabled={!date || isDateDisabled(date)}
                className={`
                  w-7 h-7 text-xs rounded transition-colors flex items-center justify-center font-medium
                  ${!date ? 'invisible' : ''}
                  ${isDateDisabled(date) 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'hover:bg-indigo-100 cursor-pointer text-gray-700'
                  }
                  ${isSelected(date) 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : ''
                  }
                  ${isToday(date) && !isSelected(date) 
                    ? 'bg-indigo-100 text-indigo-700 font-bold' 
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
                onChange('');
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

export default CustomDatePicker;
