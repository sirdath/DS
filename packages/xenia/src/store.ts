/**
 * The persistence seam. The engine talks only to these interfaces, so it never
 * knows whether availability comes from an in-memory grid or Google Calendar, or
 * whether a booking lands in a Map or in Supabase. The base ships an in-memory
 * stub; a SupabaseStore + calendar provider drop in later behind the same shape.
 */

import { synthesizeSlots } from "./availability";
import type { Appointment, AvailableSlot, BusinessConfig } from "./types";

export interface AvailabilityProvider {
  getAvailability(business: BusinessConfig, serviceId: string, date: string): Promise<AvailableSlot[]>;
}

export type NewBooking = Omit<Appointment, "id" | "createdAt">;

export interface BookingStore {
  createBooking(input: NewBooking): Promise<Appointment>;
  getBooking(id: string): Promise<Appointment | null>;
}

/** In-memory availability + bookings. Deterministic: ids increment, times held. */
export class InMemoryStore implements BookingStore, AvailabilityProvider {
  private readonly appointments = new Map<string, Appointment>();
  private readonly held = new Map<string, Set<string>>(); // `${businessId}|${date}` → times
  private seq = 0;

  private heldKey(businessId: string, date: string): string {
    return `${businessId}|${date}`;
  }

  async getAvailability(
    business: BusinessConfig,
    _serviceId: string,
    date: string,
  ): Promise<AvailableSlot[]> {
    const heldTimes = this.held.get(this.heldKey(business.id, date)) ?? new Set<string>();
    return synthesizeSlots(business.openingHours, business.policy.slotIntervalMin, date, heldTimes);
  }

  async createBooking(input: NewBooking): Promise<Appointment> {
    this.seq += 1;
    const appointment: Appointment = {
      ...input,
      id: `appt_${this.seq}`,
      createdAt: new Date().toISOString(),
    };
    this.appointments.set(appointment.id, appointment);
    const key = this.heldKey(input.businessId, input.date);
    const times = this.held.get(key) ?? new Set<string>();
    times.add(input.time);
    this.held.set(key, times);
    return appointment;
  }

  async getBooking(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) ?? null;
  }
}
