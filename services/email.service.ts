import { supabase } from "@/lib/supabase"

export interface EmailContact {
  id: string
  email: string
  location: string
  name?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailSchedule {
  id: string
  name: string
  location: string
  sendDay: number
  sendTime: string
  recurrence: 'monthly' | 'weekly' | 'daily'
  isActive: boolean
  nextSend?: string
  createdAt: string
  updatedAt: string
}



export class EmailService {
  // Email Contacts
  static async getAllContacts(): Promise<EmailContact[]> {
    try {
      const { data, error } = await supabase
        .from('email_contacts')
        .select('*')
        .order('location', { ascending: true })

      if (error) throw error

      return data?.map(contact => ({
        id: contact.id,
        email: contact.email,
        location: contact.location,
        name: contact.name,
        isActive: contact.is_active,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      })) || []
    } catch (error) {
      console.error('Error fetching email contacts:', error)
      throw error
    }
  }

  static async createContact(contact: Omit<EmailContact, "id" | "createdAt" | "updatedAt">): Promise<EmailContact> {
    try {
      const { data, error } = await supabase
        .from('email_contacts')
        .insert({
          email: contact.email,
          location: contact.location,
          name: contact.name,
          is_active: contact.isActive
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        email: data.email,
        location: data.location,
        name: data.name,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error creating email contact:', error)
      throw error
    }
  }

  static async updateContact(id: string, updates: Partial<EmailContact>): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.email !== undefined) updateData.email = updates.email
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('email_contacts')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating email contact:', error)
      throw error
    }
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting email contact:', error)
      throw error
    }
  }

  // Email Schedules
  static async getAllSchedules(): Promise<EmailSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('email_schedules')
        .select('*')
        .order('send_day', { ascending: true })

      if (error) throw error

      return data?.map(schedule => ({
        id: schedule.id,
        name: schedule.name,
        location: schedule.location,
        sendDay: schedule.send_day,
        sendTime: schedule.send_time,
        recurrence: schedule.recurrence,
        isActive: schedule.is_active,
        nextSend: schedule.next_send,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at
      })) || []
    } catch (error) {
      console.error('Error fetching email schedules:', error)
      throw error
    }
  }

  static async createSchedule(schedule: Omit<EmailSchedule, "id" | "createdAt" | "updatedAt">): Promise<EmailSchedule> {
    try {
      const { data, error } = await supabase
        .from('email_schedules')
        .insert({
          name: schedule.name,
          location: schedule.location,
          send_day: schedule.sendDay,
          send_time: schedule.sendTime,
          recurrence: schedule.recurrence,
          is_active: schedule.isActive,
          next_send: schedule.nextSend
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        name: data.name,
        location: data.location,
        sendDay: data.send_day,
        sendTime: data.send_time,
        recurrence: data.recurrence,
        isActive: data.is_active,
        nextSend: data.next_send,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error creating email schedule:', error)
      throw error
    }
  }

  static async updateSchedule(id: string, updates: Partial<EmailSchedule>): Promise<void> {
    try {
      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.sendDay !== undefined) updateData.send_day = updates.sendDay
      if (updates.sendTime !== undefined) updateData.send_time = updates.sendTime
      if (updates.recurrence !== undefined) updateData.recurrence = updates.recurrence
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.nextSend !== undefined) updateData.next_send = updates.nextSend
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('email_schedules')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating email schedule:', error)
      throw error
    }
  }

  static async deleteSchedule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting email schedule:', error)
      throw error
    }
  }


}