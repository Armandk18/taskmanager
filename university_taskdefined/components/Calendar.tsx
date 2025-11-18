'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';

interface CalendarProps {
  events: Event[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

export default function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Jours du mois précédent
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <button
        onClick={goToToday}
        className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Aujourd'hui
      </button>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day.date);
          const today = isToday(day.date);
          const selected = isSelected(day.date);

          return (
            <div
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors
                ${day.isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-50'
                }
                ${today ? 'ring-2 ring-blue-500' : ''}
                ${selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-700
              `}
            >
              <div className={`
                text-sm font-medium mb-1
                ${day.isCurrentMonth 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-400 dark:text-gray-600'
                }
                ${today ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
              `}>
                {day.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => {
                  const isPrivate = event.visibility === 'private';
                  const eventColor = isPrivate ? '#8b5cf6' : (event.color || '#3b82f6');
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) onEventClick(event);
                      }}
                      className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: eventColor, color: 'white' }}
                      title={`${event.title}${isPrivate ? ' (Privé)' : ''}`}
                    >
                      {isPrivate && '🔒 '}
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                    +{dayEvents.length - 3} autre(s)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">🌐 Public</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-gray-600 dark:text-gray-400">🔒 Privé</span>
          </div>
        </div>
      </div>
    </div>
  );
}

