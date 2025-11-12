import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  id: string;
  caseId: string;
  caseName: string;
  doctorId: string;
  doctorName: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface SimpleCalendarProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  doctorId?: string; // Filter by doctor if provided
  view?: 'month' | 'week';
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  doctorId,
  view = 'month',
}) => {
  const { t, language } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Filter events by doctor if provided
  const filteredEvents = doctorId
    ? events.filter((e) => e.doctorId === doctorId)
    : events;

  // Check if we're showing multiple doctors (for showing doctor names)
  const uniqueDoctorIds = new Set(filteredEvents.map(e => e.doctorId));
  const showingMultipleDoctors = uniqueDoctorIds.size > 1;

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  filteredEvents.forEach((event) => {
    const dateKey = event.date.split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(month - 1);
      } else {
        newDate.setMonth(month + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    onDateSelect?.(clickedDate);
  };

  const getDayEvents = (day: number): CalendarEvent[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  const dayNames = language === 'fr'
    ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthNames = language === 'fr'
    ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('language') === 'fr' ? 'Aujourd\'hui' : 'Today'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-700 p-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getDayEvents(day);
            const isToday =
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={cn(
                  'aspect-square border border-gray-200 rounded p-1 cursor-pointer hover:bg-gray-50 transition-colors',
                  isToday && 'bg-blue-50 border-blue-300',
                  dayEvents.length > 0 && 'bg-green-50'
                )}
                onClick={() => handleDateClick(day)}
              >
                <div className="text-sm font-medium mb-1">{day}</div>
                {dayEvents.length > 0 && (
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => {
                      // Generate a color based on doctor ID for visual distinction
                      const doctorColors = [
                        'bg-blue-200 text-blue-800',
                        'bg-purple-200 text-purple-800',
                        'bg-pink-200 text-pink-800',
                        'bg-indigo-200 text-indigo-800',
                        'bg-teal-200 text-teal-800',
                      ];
                      const colorIndex = parseInt(event.doctorId?.replace(/\D/g, '') || '0') % doctorColors.length;
                      const doctorColor = doctorColors[colorIndex] || 'bg-gray-200 text-gray-800';
                      
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs p-0.5 rounded truncate',
                            event.status === 'completed' && 'bg-green-200 text-green-800',
                            event.status === 'cancelled' && 'bg-gray-200 text-gray-600',
                            event.status === 'scheduled' && doctorColor
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          title={`${event.doctorName} - ${event.caseName} - ${event.time}`}
                        >
                          <span className="font-medium">{event.time}</span> {event.caseName.substring(0, 8)}
                          {showingMultipleDoctors && (
                            <span className="text-[10px] opacity-75"> • {event.doctorName.split(' ').pop()}</span>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} {t('language') === 'fr' ? 'plus' : 'more'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

