import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { environment } from 'src/env/env.local';

interface Stall {
  _id: string;
  stallNumber: string;
  stallName: string;
  size: string;
  location: string;
  price: number;
  amenities: string[];
  isAvailable: boolean;
  isBooked: boolean;
  approvedUserId: string | null;
  bookings: Booking[];
}

interface Booking {
  _id: string;
  userId: any;
  businessName: string;
  contactNumber: string;
  email: string;
  additionalInfo: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  bookedAt: string;
  approvedAt?: string | null;
}

interface Event {
  _id: string;
  title: string;
  organizerId: any;
  stalls: Stall[];
  totalStalls: number;
  availableStalls: number;
  bookedStalls: number;
  pendingStallRequests: number;
}

@Component({
  selector: 'app-event-stalls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-stalls.component.html',
  styleUrls: ['./event-stalls.component.scss']
})
export class EventStallsComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  stalls: Stall[] = [];
  loading: boolean = false;
  processingBooking: boolean = false;
  imageurl = environment.imageUrl;
  
  // Bookings data
  allBookings: any[] = [];
  pendingBookings: any[] = [];
  approvedBookings: any[] = [];
  showBookings: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Try both queryParams and snapshot
    const eventIdFromQuery = this.route.snapshot.queryParams['eventId'];
    const eventIdFromRoute = this.route.snapshot.paramMap.get('eventId');
    
    this.eventId = eventIdFromQuery || eventIdFromRoute || '';
    
    console.log('Event ID from query params:', eventIdFromQuery);
    console.log('Event ID from route params:', eventIdFromRoute);
    console.log('Final Event ID:', this.eventId);
    
    if (this.eventId) {
      this.fetchEventDetails();
    } else {
      // Try subscribing to query params as fallback
      this.route.queryParams.subscribe(params => {
        this.eventId = params['eventId'] || '';
        console.log('Event ID from subscription:', this.eventId);
        if (this.eventId) {
          this.fetchEventDetails();
        } else {
          swalHelper.showToast('Event ID is missing', 'error');
          this.router.navigate(['/newEvents']);
        }
      });
    }
  }

  async fetchEventDetails(): Promise<void> {
    if (!this.eventId || this.eventId.trim() === '') {
      console.error('Event ID is empty:', this.eventId);
      swalHelper.showToast('Event ID is missing', 'error');
      this.router.navigate(['/newEvents']);
      return;
    }

    this.loading = true;
    try {
      console.log('Fetching event details for ID:', this.eventId);
      const response = await this.eventService.newGetEventById(this.eventId);
      console.log('Event details response:', response);
      
      if (response && response.success && response.data && response.data.event) {
        const eventData = response.data.event;
        
        // Map the response to match our interface
        this.event = {
          _id: eventData.eventInfo._id,
          title: eventData.eventInfo.title,
          organizerId: eventData.organizerId || eventData.organizer,
          stalls: eventData.stalls || [],
          totalStalls: eventData.totalStalls || 0,
          availableStalls: eventData.availableStalls || 0,
          bookedStalls: eventData.bookedStalls || 0,
          pendingStallRequests: eventData.pendingStallRequests || 0
        };
        
        this.stalls = eventData.stalls || [];
        
        // Fetch stall bookings
        await this.fetchStallBookings();
        
        this.cdr.detectChanges();
      } else {
        const errorMsg = response?.message || 'Failed to fetch event details';
        console.error('Failed to fetch event:', errorMsg);
        swalHelper.showToast(errorMsg, 'error');
        this.router.navigate(['/newEvents']);
      }
    } catch (error: any) {
      console.error('Error fetching event details:', error);
      const errorMsg = error?.message || 'Failed to fetch event details';
      swalHelper.showToast(errorMsg, 'error');
      this.router.navigate(['/newEvents']);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/newEvents']);
  }

  getStallStatusClass(stall: Stall): string {
    if (stall.isBooked) {
      return 'bg-danger';
    } else if (!stall.isAvailable) {
      return 'bg-warning';
    } else {
      return 'bg-success';
    }
  }

  getStallStatusText(stall: Stall): string {
    if (stall.isBooked) {
      return 'Booked';
    } else if (!stall.isAvailable && stall.bookings && stall.bookings.length > 0) {
      return 'Pending';
    } else if (!stall.isAvailable) {
      return 'Unavailable';
    } else {
      return 'Available';
    }
  }

  async fetchStallBookings(): Promise<void> {
    if (!this.eventId) return;
    
    try {
      const response = await this.eventService.getEventStallBookings({ eventId: this.eventId });
      
      if (response && response.success && response.data) {
        this.allBookings = response.data.allBookings || [];
        this.pendingBookings = response.data.bookingsByStatus?.pending || [];
        this.approvedBookings = response.data.bookingsByStatus?.approved || [];
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching stall bookings:', error);
    }
  }

  async updateBookingStatus(stallId: string, bookingId: string, action: 'approve' | 'reject' | 'cancel'): Promise<void> {
    if (!this.eventId) return;

    const actionText = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'cancel';
    const confirmMessage = `Are you sure you want to ${actionText} this booking?`;
    
    const result = await swalHelper.confirmation(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Booking`,
      confirmMessage,
      'warning'
    );

    if (!result.isConfirmed) return;

    this.processingBooking = true;
    try {
      const response = await this.eventService.approveStallBooking({
        eventId: this.eventId,
        stallId: stallId,
        bookingId: bookingId,
        action: action
      });

      if (response && response.success) {
        swalHelper.showToast(`Booking ${actionText}d successfully`, 'success');
        // Refresh event details and bookings
        await Promise.all([
          this.fetchEventDetails(),
          this.fetchStallBookings()
        ]);
      } else {
        swalHelper.showToast(response?.message || `Failed to ${actionText} booking`, 'error');
      }
    } catch (error: any) {
      console.error(`Error ${actionText}ing booking:`, error);
      swalHelper.showToast(`Failed to ${actionText} booking`, 'error');
    } finally {
      this.processingBooking = false;
      this.cdr.detectChanges();
    }
  }

  getBookingForStall(stall: Stall): Booking | null {
    if (!stall.bookings || stall.bookings.length === 0) return null;
    // Return pending booking first, then approved
    const pending = stall.bookings.find(b => b.status === 'pending');
    if (pending) return pending;
    return stall.bookings.find(b => b.status === 'approved') || null;
  }

  hasPendingBookings(stall: Stall): boolean {
    return stall.bookings && stall.bookings.some(b => b.status === 'pending');
  }

  toggleBookingsView(): void {
    this.showBookings = !this.showBookings;
  }
}

