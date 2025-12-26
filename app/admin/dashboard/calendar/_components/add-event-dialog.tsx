"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Link as LinkIcon, Loader2, CalendarIcon } from "lucide-react";
import { fetchFavicon } from "@/lib/fetch-favicon";

interface EventLink {
  label: string;
  icon?: string;
  url: string;
}

interface EventFormData {
  title: string;
  date: Date;
  time: string;
  links: EventLink[];
  notifyBySlack: boolean;
  notifyBeforeMinutes: number;
}

export const AddEventDialog = ({
  onEventCreated,
}: {
  onEventCreated?: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: new Date(),
    time: "09:00",
    links: [],
    notifyBySlack: false,
    notifyBeforeMinutes: 15,
  });

  const [newLink, setNewLink] = useState<EventLink>({
    label: "",
    url: "",
    icon: undefined,
  });

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url) {
      toast.error("Please fill in both label and URL");
      return;
    }

    try {
      
      const icon = await fetchFavicon(newLink.url);
      const linkToAdd = { ...newLink, icon };

      setFormData({
        ...formData,
        links: [...formData.links, linkToAdd],
      });

      setNewLink({ label: "", url: "", icon: undefined });
    } catch (error) {
      console.error("Error adding link:", error);
      
      setFormData({
        ...formData,
        links: [...formData.links, { ...newLink }],
      });
      setNewLink({ label: "", url: "", icon: undefined });
    }
  };

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      
      const [hours, minutes] = formData.time.split(":").map(Number);
      const eventDate = new Date(formData.date);
      eventDate.setHours(hours, minutes, 0, 0);

      const response = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          date: eventDate,
          links: formData.links,
          status: "scheduled",
          notifyBySlack: formData.notifyBySlack,
          notifyBeforeMinutes: formData.notifyBeforeMinutes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create event");
      toast.success("Event created successfully");

      
      setFormData({
        title: "",
        date: new Date(),
        time: "09:00",
        links: [],
        notifyBySlack: false,
        notifyBeforeMinutes: 15,
      });
      setOpen(false);
      onEventCreated?.();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4 w-full max-w-4xl mx-auto">
          <Plus />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new calendar event for any date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Team meeting, deadline, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
              <TimePicker
                value={formData.time}
                onChange={(time) => setFormData({ ...formData, time })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Related Links</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Label"
                value={newLink.label}
                onChange={(e) =>
                  setNewLink({ ...newLink, label: e.target.value })
                }
              />
              <Input
                placeholder="URL"
                type="url"
                value={newLink.url}
                onChange={(e) =>
                  setNewLink({ ...newLink, url: e.target.value })
                }
              />
              <Button
                type="button"
                onClick={handleAddLink}
                size="icon"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.links.length > 0 && (
              <div className="space-y-2 mt-3">
                {formData.links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    {link.icon ? (
                      <img
                        src={link.icon}
                        alt=""
                        className="w-4 h-4"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : null}
                    <LinkIcon
                      className={cn("w-4 h-4", link.icon && "hidden")}
                    />
                    <span className="flex-1 text-sm">{link.label}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveLink(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                className="border-foreground!"
                id="notifyBySlack"
                checked={formData.notifyBySlack}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyBySlack: !!checked })
                }
              />
              <Label htmlFor="notifyBySlack" className="cursor-pointer">
                Notify by Slack
              </Label>
            </div>

            {formData.notifyBySlack && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="notifyBeforeMinutes" className="text-sm">
                  Notify before (minutes)
                </Label>
                <Input
                  id="notifyBeforeMinutes"
                  type="number"
                  min="1"
                  value={formData.notifyBeforeMinutes ?? 15}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifyBeforeMinutes: Number.parseInt(e.target.value) || 15,
                    })
                  }
                  className="text-sm max-w-xs"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
