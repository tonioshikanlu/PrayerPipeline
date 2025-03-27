import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePrayerReminders, PrayerReminderWithDays } from '@/hooks/use-prayer-reminders';
import { PrayerReminderDialog } from './prayer-reminder-dialog';
import { Clock, Edit2, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PrayerRemindersCard() {
  const { reminders, isLoading, updateReminder, deleteReminder, isUpdating, isDeleting } = usePrayerReminders();
  const [reminderToDelete, setReminderToDelete] = useState<PrayerReminderWithDays | null>(null);

  const handleStatusToggle = (reminder: PrayerReminderWithDays) => {
    updateReminder({
      id: reminder.id,
      data: { isActive: !reminder.isActive }
    });
  };

  const handleDeleteReminder = () => {
    if (reminderToDelete) {
      deleteReminder(reminderToDelete.id, {
        onSuccess: () => setReminderToDelete(null)
      });
    }
  };

  const formatReminderSchedule = (reminder: PrayerReminderWithDays) => {
    if (!reminder.isRecurring) {
      return 'One-time';
    }

    // Convert day names to short form (e.g., "Mon, Wed, Fri")
    const shortDayMap: Record<string, string> = {
      sunday: 'Sun',
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
    };

    const formattedDays = reminder.recurringDays
      .map(day => shortDayMap[day] || day)
      .join(', ');

    return formattedDays;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Prayer Reminders</CardTitle>
          <PrayerReminderDialog mode="create" />
        </div>
        <CardDescription>
          Set up reminders to maintain a consistent prayer routine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground">No prayer reminders set up yet</p>
            <PrayerReminderDialog
              mode="create"
              trigger={
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add your first reminder
                </Button>
              }
            />
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`flex flex-col border rounded-lg p-3 
                ${!reminder.isActive ? 'bg-muted/30 border-dashed' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <div className="font-medium flex items-center gap-1">
                    {reminder.title}
                    {!reminder.isActive && (
                      <Badge variant="outline" className="ml-2">Disabled</Badge>
                    )}
                  </div>
                  {reminder.description && (
                    <p className="text-sm text-muted-foreground">{reminder.description}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStatusToggle(reminder)}
                          disabled={isUpdating}
                        >
                          {reminder.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {reminder.isActive ? 'Disable reminder' : 'Enable reminder'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <PrayerReminderDialog
                    mode="edit"
                    existingReminder={reminder}
                    trigger={
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit reminder</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    }
                  />

                  <AlertDialog open={reminderToDelete?.id === reminder.id} onOpenChange={(open) => {
                    if (!open) setReminderToDelete(null);
                  }}>
                    <AlertDialogTrigger asChild>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setReminderToDelete(reminder)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete reminder</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Prayer Reminder</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this prayer reminder? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteReminder}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="flex gap-4 items-center mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {reminder.reminderTime?.toString().substring(0, 5)}
                </div>
                
                {reminder.isRecurring && (
                  <div>
                    {formatReminderSchedule(reminder)}
                  </div>
                )}
                
                {reminder.activeUntil && (
                  <div>
                    Until {format(new Date(reminder.activeUntil), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}