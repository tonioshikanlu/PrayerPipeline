import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { usePrayerReminders, PrayerReminderWithDays, CreatePrayerReminderData } from '@/hooks/use-prayer-reminders';
import { CalendarIcon, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PrayerReminder } from '@shared/schema';

interface PrayerReminderDialogProps {
  mode: 'create' | 'edit';
  existingReminder?: PrayerReminderWithDays;
  trigger?: React.ReactNode;
}

const daysOfWeek = [
  { id: 'sunday', label: 'Sun' },
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
] as const;

export function PrayerReminderDialog({
  mode = 'create',
  existingReminder,
  trigger,
}: PrayerReminderDialogProps) {
  const [open, setOpen] = useState(false);
  const { createReminder, updateReminder, isCreating, isUpdating } = usePrayerReminders();
  
  // Form state
  const [title, setTitle] = useState(existingReminder?.title || 'Prayer Time');
  const [description, setDescription] = useState(existingReminder?.description || '');
  const [reminderTime, setReminderTime] = useState(existingReminder?.reminderTime?.toString().substring(0, 5) || '08:00');
  const [isRecurring, setIsRecurring] = useState(existingReminder?.isRecurring || false);
  const [recurringDays, setRecurringDays] = useState<string[]>(
    existingReminder?.recurringDays || ['monday', 'wednesday', 'friday']
  );
  const [activeUntil, setActiveUntil] = useState<Date | undefined>(
    existingReminder?.activeUntil ? new Date(existingReminder.activeUntil) : undefined
  );
  const [isActive, setIsActive] = useState(existingReminder?.isActive ?? true);

  const resetForm = () => {
    if (mode === 'create') {
      setTitle('Prayer Time');
      setDescription('');
      setReminderTime('08:00');
      setIsRecurring(false);
      setRecurringDays(['monday', 'wednesday', 'friday']);
      setActiveUntil(undefined);
      setIsActive(true);
    }
  };

  const handleToggleDay = (day: string) => {
    setRecurringDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have at least one day selected if recurring
    if (isRecurring && recurringDays.length === 0) {
      alert('Please select at least one day for recurring reminders');
      return;
    }

    const reminderData: CreatePrayerReminderData = {
      title,
      description,
      reminderTime,
      isRecurring,
      recurringDays: isRecurring ? recurringDays : undefined,
      activeUntil: activeUntil || undefined,
      isActive,
    };

    if (mode === 'create') {
      createReminder(reminderData, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        }
      });
    } else if (existingReminder) {
      updateReminder({
        id: existingReminder.id,
        data: reminderData
      }, {
        onSuccess: () => {
          setOpen(false);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            {mode === 'create' ? 'Add Reminder' : 'Edit'}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Prayer Reminder' : 'Edit Prayer Reminder'}
          </DialogTitle>
          <DialogDescription>
            Set up reminders to help establish a consistent prayer routine.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Prayer Time"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description || ''}
              onChange={e => setDescription(e.target.value)}
              placeholder="Time to pray for..."
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <div className="flex items-center">
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                required
                className="flex-1"
              />
              <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isRecurring">Recurring Reminder</Label>
            <Switch
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          
          {isRecurring && (
            <div className="space-y-2 border rounded-md p-3 bg-muted/30">
              <Label>Repeat on days</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center space-x-1">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={recurringDays.includes(day.id)}
                      onCheckedChange={() => handleToggleDay(day.id)}
                    />
                    <Label htmlFor={`day-${day.id}`} className="text-sm cursor-pointer">{day.label}</Label>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 space-y-2">
                <Label>Active until (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !activeUntil && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeUntil ? format(activeUntil, "PPP") : "No end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={activeUntil}
                      onSelect={setActiveUntil}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                    {activeUntil && (
                      <div className="p-2 border-t border-border">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveUntil(undefined)}
                        >
                          Clear date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="isActive">Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}