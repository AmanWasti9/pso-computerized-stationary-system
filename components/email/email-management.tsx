"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Mail, Plus, Edit, Trash2, Calendar, Clock, Users, Send, TestTube } from "lucide-react"
import { EmailService, type EmailContact, type EmailSchedule } from "@/services/email.service"
import { useAuth } from "@/components/providers/auth-provider"

export function EmailManagement() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [schedules, setSchedules] = useState<EmailSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    missingVars?: string[];
    placeholderVars?: string[];
    error?: string;
  } | null>(null)

  // Contact form state
  const [contactForm, setContactForm] = useState({
    email: "",
    location: "",
    name: "",
    isActive: true
  })
  const [editingContact, setEditingContact] = useState<EmailContact | null>(null)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    location: "",
    sendDay: 1,
    sendTime: "",
    recurrence: "monthly" as "monthly" | "weekly" | "daily",
    isActive: true
  })
  const [editingSchedule, setEditingSchedule] = useState<EmailSchedule | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
    checkEmailConfig()
    
    // Start automatic email scheduler
    const schedulerInterval = setInterval(async () => {
      try {
        console.log('🕐 Checking for due emails...', new Date().toISOString());
        const response = await fetch('/api/email/send-all-due', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result.success && result.processed > 0) {
          console.log('📧 Sent scheduled emails:', result);
          toast.success(`Sent ${result.totalSent} scheduled emails`);
          loadData(); // Refresh data after sending
        }
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    }, 60000); // Check every minute

    // Cleanup interval on component unmount
    return () => clearInterval(schedulerInterval);
  }, [])

  const checkEmailConfig = async () => {
    try {
      const response = await fetch('/api/email/test-config');
      const data = await response.json();
      
      if (data.success) {
        setConfigStatus({ isValid: true });
      } else {
        setConfigStatus({ 
          isValid: false, 
          missingVars: data.missingVars,
          placeholderVars: data.placeholderVars,
          error: data.error 
        });
      }
    } catch (error: any) {
      console.error('Error checking email config:', error);
      setConfigStatus({ 
        isValid: false, 
        error: 'Failed to check email configuration' 
      });
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [contactsData, schedulesData] = await Promise.all([
        EmailService.getAllContacts(),
        EmailService.getAllSchedules()
      ])

      setContacts(contactsData)
      setSchedules(schedulesData)
    } catch (error: any) {
      console.error('Error loading email data:', error)
      
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        toast.error('Email database tables not found. Please run the migration script to create the required tables.')
      } else {
        toast.error('Failed to load email data: ' + (error.message || 'Unknown error'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Contact handlers
  const handleSaveContact = async () => {
    if (!contactForm.email || !contactForm.location) {
      toast.error('Email and location are required')
      return
    }

    try {
      if (editingContact) {
        await EmailService.updateContact(editingContact.id, contactForm)
        toast.success('Contact updated successfully')
      } else {
        await EmailService.createContact(contactForm)
        toast.success('Contact added successfully')
      }
      
      setContactDialogOpen(false)
      resetContactForm()
      loadData()
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Failed to save contact')
    }
  }

  const handleEditContact = (contact: EmailContact) => {
    setEditingContact(contact)
    setContactForm({
      email: contact.email,
      location: contact.location,
      name: contact.name || "",
      isActive: contact.isActive
    })
    setContactDialogOpen(true)
  }

  const handleDeleteContact = async (id: string) => {
    try {
      await EmailService.deleteContact(id)
      toast.success('Contact deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  const resetContactForm = () => {
    setContactForm({
      email: "",
      location: "",
      name: "",
      isActive: true
    })
    setEditingContact(null)
  }

  // Schedule handlers
  const handleSaveSchedule = async () => {
    if (!scheduleForm.name || !scheduleForm.location || !scheduleForm.sendTime) {
      toast.error('Schedule name, location, and time are required')
      return
    }

    try {
      const nextSend = calculateNextSend(scheduleForm.sendDay, scheduleForm.sendTime, scheduleForm.recurrence)
      
      if (editingSchedule) {
        await EmailService.updateSchedule(editingSchedule.id, {
          ...scheduleForm,
          nextSend
        })
        toast.success('Schedule updated successfully')
      } else {
        await EmailService.createSchedule({
          ...scheduleForm,
          nextSend
        })
        toast.success('Schedule created successfully')
      }
      
      setScheduleDialogOpen(false)
      resetScheduleForm()
      loadData()
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Failed to save schedule')
    }
  }

  const handleEditSchedule = (schedule: EmailSchedule) => {
    setEditingSchedule(schedule)
    setScheduleForm({
      name: schedule.name,
      location: "All Locations", // Always set to "All Locations" for reminder emails
      sendDay: schedule.sendDay,
      sendTime: schedule.sendTime,
      recurrence: schedule.recurrence,
      isActive: schedule.isActive
    })
    setScheduleDialogOpen(true)
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      await EmailService.deleteSchedule(id)
      toast.success('Schedule deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast.error('Failed to delete schedule')
    }
  }

  const resetScheduleForm = () => {
    setScheduleForm({
      name: "",
      location: "All Locations", // Fixed value for reminder emails
      sendDay: 1,
      sendTime: "",
      recurrence: "monthly",
      isActive: true
    })
    setEditingSchedule(null)
  }

  const handleSendAllDue = async () => {
    try {
      const response = await fetch('/api/email/send-all-due', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        if (data.processed === 0) {
          toast.info('No reminder schedules are currently due');
        } else {
          toast.success(`Processed ${data.processed} schedule(s)! Total sent: ${data.totalSent || 0}, Failed: ${data.totalFailed || 0}`);
        }
        loadData(); // Refresh logs
      } else {
        if (data.error?.includes('Email tables not found') || data.error?.includes('migration script')) {
          toast.error('Email database tables not found. Please run the migration script first.');
        } else {
          toast.error(`Failed to send due reminders: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error('Error sending due reminders:', error);
      toast.error('Failed to send due reminders: ' + (error.message || 'Network error'));
    }
  }

  const handleTestEmail = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduleId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Reminder emails sent to all locations! Sent: ${data.results?.sent || 0}, Failed: ${data.results?.failed || 0}`);
        loadData(); // Refresh logs
      } else {
        if (data.error?.includes('Email tables not found') || data.error?.includes('migration script')) {
          toast.error('Email database tables not found. Please run the migration script first.');
        } else {
          toast.error(`Failed to send reminder emails: ${data.error}`);
        }
      }
    } catch (error: any) {
      console.error('Error sending reminder email:', error);
      toast.error('Failed to send reminder emails: ' + (error.message || 'Network error'));
    }
  }

  const calculateNextSend = (sendDay: number, time: string, recurrence: string): string => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // Create a date for this month with the specified day and time
    const [hours, minutes] = time.split(':').map(Number)
    const sendDateTime = new Date(currentYear, currentMonth, sendDay, hours, minutes)
    
    // If the date has already passed this month, move to next occurrence
    if (sendDateTime <= now) {
      switch (recurrence) {
        case 'monthly':
          sendDateTime.setMonth(sendDateTime.getMonth() + 1)
          break
        case 'weekly':
          sendDateTime.setDate(sendDateTime.getDate() + 7)
          break
        case 'daily':
          sendDateTime.setDate(sendDateTime.getDate() + 1)
          break
      }
    }
    
    return sendDateTime.toISOString()
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Configuration Status Banner */}
      {configStatus && !configStatus.isValid && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <TestTube className="h-5 w-5" />
              <div>
                <h4 className="font-semibold">Email Configuration Issue</h4>
                <p className="text-sm">
                  {configStatus.error || 'Email configuration is incomplete.'}
                  {configStatus.missingVars && configStatus.missingVars.length > 0 && (
                    <span className="block mt-1">
                      Missing variables: {configStatus.missingVars.join(', ')}
                    </span>
                  )}
                  {configStatus.placeholderVars && configStatus.placeholderVars.length > 0 && (
                    <span className="block mt-1">
                      Placeholder values in: {configStatus.placeholderVars.join(', ')}
                    </span>
                  )}
                </p>
                <p className="text-sm mt-2">
                  Please update your <code className="bg-red-100 px-1 rounded">.env.local</code> file with real email credentials.
                  See <code className="bg-red-100 px-1 rounded">EMAIL_SETUP_GUIDE.md</code> for detailed instructions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 mr-3 text-gray-600" />
            Email Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contacts" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedules
              </TabsTrigger>
            </TabsList>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Email Contacts</h3>
                <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetContactForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingContact ? 'Edit Contact' : 'Add New Contact'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={contactForm.location}
                          onChange={(e) => setContactForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={contactForm.isActive}
                          onCheckedChange={(checked) => setContactForm(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveContact}>
                          {editingContact ? 'Update' : 'Add'} Contact
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.location}</TableCell>
                        <TableCell>{contact.name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={contact.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {contact.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditContact(contact)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Schedules Tab */}
            <TabsContent value="schedules" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reminder Email Schedules</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSendAllDue}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send All Due Reminders
                  </Button>
                  <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetScheduleForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Reminder Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSchedule ? 'Edit Reminder Schedule' : 'Create New Reminder Schedule'}
                        </DialogTitle>
                        <p className="text-sm text-gray-600 mt-2">
                          Reminder emails will be sent to all active contacts across all locations.
                        </p>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="scheduleName">Reminder Name</Label>
                          <Input
                            id="scheduleName"
                            value={scheduleForm.name}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Monthly Inventory Update Reminder"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Recipients</Label>
                          <Input
                            id="location"
                            value={scheduleForm.location}
                            readOnly
                            className="bg-gray-50 text-gray-600"
                            placeholder="All Locations"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Reminder emails are automatically sent to all active contacts
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="sendDay">Send Day of Month</Label>
                          <Input
                            id="sendDay"
                            type="number"
                            min="1"
                            max="31"
                            value={scheduleForm.sendDay}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, sendDay: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sendTime">Send Time</Label>
                          <Input
                            id="sendTime"
                            type="time"
                            value={scheduleForm.sendTime}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, sendTime: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="recurrence">Recurrence</Label>
                          <select
                            id="recurrence"
                            value={scheduleForm.recurrence}
                            onChange={(e) => setScheduleForm(prev => ({ ...prev, recurrence: e.target.value as "monthly" | "weekly" | "daily" }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="daily">Daily</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="scheduleActive"
                            checked={scheduleForm.isActive}
                            onCheckedChange={(checked) => setScheduleForm(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label htmlFor="scheduleActive">Active</Label>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSchedule}>
                            {editingSchedule ? 'Update' : 'Create'} Schedule
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reminder Name</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Send Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Recurrence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>{schedule.location}</TableCell>
                        <TableCell>{schedule.sendDay}</TableCell>
                        <TableCell>{schedule.sendTime}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {schedule.recurrence}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={schedule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestEmail(schedule.id)}
                              title="Send Reminder Now"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}