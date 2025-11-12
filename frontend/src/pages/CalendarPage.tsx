import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SimpleCalendar } from '@/components/calendar/SimpleCalendar';
import { CalendarEventModal } from '@/components/calendar/CalendarEventModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllCalendarEvents, getCalendarEventsForDoctor, type CalendarEvent, bookCaseAppointment } from '@/utils/calendarUtils';
import { getAllAssignments } from '@/utils/adminCaseAssignment';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/authClient';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export const CalendarPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const addToast = useUIStore(state => state.addToast);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [caseToBook, setCaseToBook] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadEvents();
    
    const handleCalendarUpdate = () => {
      loadEvents();
    };

    window.addEventListener('calendarUpdated', handleCalendarUpdate);
    window.addEventListener('assignmentUpdated', handleCalendarUpdate);

    return () => {
      window.removeEventListener('calendarUpdated', handleCalendarUpdate);
      window.removeEventListener('assignmentUpdated', handleCalendarUpdate);
    };
  }, [user?.id]);

  const loadEvents = () => {
    if (user?.id && user?.role === 'user') {
      // Doctor view - show only their events
      const doctorEvents = getCalendarEventsForDoctor(user.id);
      setEvents(doctorEvents);
    } else {
      // Admin/Clinic view - show all events
      const allEvents = getAllCalendarEvents();
      setEvents(allEvents);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Show available cases for booking on this date
    const unbookedCases = getAllAssignments().filter(
      (case_) => case_.assignedTo && !case_.scheduledDate && case_.status !== 'rejected'
    );
    if (unbookedCases.length > 0) {
      // For now, just show the first unbooked case
      // In production, this could show a list to choose from
      setCaseToBook({
        id: unbookedCases[0].id,
        name: unbookedCases[0].patientName || unbookedCases[0].claimId || unbookedCases[0].fileName,
      });
      setShowBookingModal(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleBook = (date: string, time: string) => {
    if (caseToBook) {
      bookCaseAppointment(caseToBook.id, date, time);
      addToast({
        type: 'success',
        title: t('language') === 'fr' ? 'Rendez-vous planifié' : 'Appointment Scheduled',
        message: t('language') === 'fr'
          ? `Le cas a été planifié pour le ${date} à ${time}`
          : `Case scheduled for ${date} at ${time}`,
      });
      setCaseToBook(null);
      loadEvents();
    }
  };

  const handleBookNewCase = () => {
    const unbookedCases = getAllAssignments().filter(
      (case_) => case_.assignedTo && !case_.scheduledDate && case_.status !== 'rejected'
    );
    if (unbookedCases.length > 0) {
      setCaseToBook({
        id: unbookedCases[0].id,
        name: unbookedCases[0].patientName || unbookedCases[0].claimId || unbookedCases[0].fileName,
      });
      setShowBookingModal(true);
    } else {
      addToast({
        type: 'info',
        title: t('language') === 'fr' ? 'Aucun cas disponible' : 'No Cases Available',
        message: t('language') === 'fr'
          ? 'Tous les cas ont déjà été planifiés'
          : 'All cases have already been scheduled',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('calendar')}</h1>
          <p className="text-white/80 mt-1">
            {user?.role === 'user'
              ? t('language') === 'fr'
                ? 'Votre calendrier de rendez-vous'
                : 'Your appointment calendar'
              : t('language') === 'fr'
              ? 'Calendrier de la clinique'
              : 'Clinic calendar'}
          </p>
        </div>
        <Button onClick={handleBookNewCase} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('language') === 'fr' ? 'Planifier un cas' : 'Schedule Case'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SimpleCalendar
            events={events}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            doctorId={user?.role === 'user' ? user.id : undefined}
          />
        </div>

        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t('language') === 'fr' ? 'Prochains rendez-vous' : 'Upcoming Appointments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events
                .filter((e) => e.status === 'scheduled' && new Date(e.date) >= new Date())
                .sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.time}`);
                  const dateB = new Date(`${b.date}T${b.time}`);
                  return dateA.getTime() - dateB.getTime();
                })
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-3 mb-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="text-sm font-medium">{event.caseName}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(event.date).toLocaleDateString(t('language') === 'fr' ? 'fr-CA' : 'en-CA')} à {event.time}
                    </div>
                    <div className="text-xs text-gray-500">{event.doctorName}</div>
                  </div>
                ))}
              {events.filter((e) => e.status === 'scheduled' && new Date(e.date) >= new Date()).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t('language') === 'fr' ? 'Aucun rendez-vous à venir' : 'No upcoming appointments'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Event Details */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {t('language') === 'fr' ? 'Détails du rendez-vous' : 'Appointment Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-xs text-gray-600">{t('language') === 'fr' ? 'Cas' : 'Case'}</div>
                  <div className="text-sm font-medium">{selectedEvent.caseName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">{t('language') === 'fr' ? 'Date' : 'Date'}</div>
                  <div className="text-sm">
                    {new Date(selectedEvent.date).toLocaleDateString(t('language') === 'fr' ? 'fr-CA' : 'en-CA')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">{t('language') === 'fr' ? 'Heure' : 'Time'}</div>
                  <div className="text-sm">{selectedEvent.time}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">{t('doctor')}</div>
                  <div className="text-sm">{selectedEvent.doctorName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">{t('language') === 'fr' ? 'Statut' : 'Status'}</div>
                  <div className="text-sm">
                    {selectedEvent.status === 'scheduled'
                      ? t('language') === 'fr'
                        ? 'Planifié'
                        : 'Scheduled'
                      : selectedEvent.status === 'completed'
                      ? t('language') === 'fr'
                        ? 'Complété'
                        : 'Completed'
                      : t('language') === 'fr'
                      ? 'Annulé'
                      : 'Cancelled'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CalendarEventModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        caseId={caseToBook?.id}
        caseName={caseToBook?.name}
        doctorId={user?.id}
        onBook={handleBook}
      />
    </div>
  );
};

