import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

import { AuthService, EventService, CouponService, Coupon } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var $: any;
declare var bootstrap: any;

// Interface for Event data
interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  venue: string;
  mapUrl: string;
  eventType: string;
  capacity: number;
  ticketPrice: number;
  bannerImage: string;
  registrationLink: string;
  isActive: boolean;
  sponsors: any[];
  schedules: any[];
  speakers: any[];
  createdAt: string;
  updatedAt?: string;
  pricing: Pricing[];
  organizerId?: {
    _id: string;
    name: string;
    mobile_number?: string;
    email?: string;
    business_name?: string;
    profilePic?: string;
  } | string;
  totalStalls?: number;
  availableStalls?: number;
  bookedStalls?: number;
  pendingStallRequests?: number;
  stalls?: any[];
  coupons?: Array<{
    _id: string;
    code: string;
    title: string;
    description: string;
    discountType: string;
    discountValue: number;
    image?: string;
    validFrom?: string;
    validUntil?: string;
    usageLimit?: number;
    usedCount?: number;
    isActive?: boolean;
  }>;
}

// Interface for Pricing
interface Pricing {
  businessType: string;
  ticketPrice: number;
  stayFee: number;
}

// Interface for API Response
interface EventResponse {
  success: boolean;
  message: string;
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

interface Sponsor {
  name: string;
  logo: string | File | null;
  website: string;
  tier: string;
  description: string;
  contactEmail: string;
}

interface Speaker {
  _id?: string;
  name: string;
  bio: string;
  photo: string | File | null;
  email: string;
  socialLinks: {
    linkedin: string;
    twitter: string;
    website: string;
    instagram: string;
  };
  date: string;
}

interface GalleryItem {
  _id?: string;
  type: 'image' | 'video';
  url: string | File | null;
  caption: string;
  uploadedAt?: Date;
}

interface UpiPaymentDetails {
  _id?: string;
  eventId: string;
  amount: number;
  paymentMethod: 'upi';
  qrCodeUrl: string;
  status: 'pending' | 'completed' | 'failed';
  isApproved: boolean;
  extraDetails?: any;
  createdAt?: Date;
  updatedAt?: Date;
}


interface Schedule {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  speakerId: string | null;
  location: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgxPaginationModule],
  providers: [],
  templateUrl: './new-events.component.html',
  styleUrls: ['./new-events.component.scss']
})
export class NewEventsComponent implements OnInit, AfterViewInit {
  eventForm: any = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
    mapUrl: '',
    eventType: 'offline',
    capacity: null,
    organizerId: '',
    totalStalls: null,
    stallPrice: 0,
    stallSize: '10x10 ft',
    sponsors: [] as Sponsor[],
    speakers: [] as Speaker[],
    schedules: [] as Schedule[],
    bannerImage: null,
    b2bTicketPrice: 0,
    b2bStayFee: 0,
    b2cTicketPrice: 0,
    b2cStayFee: 0,
    couponId: '',
  };

  editEventForm: any = {
    speakers: [],
    sponsors: [],
    schedules: [],
    organizerId: '',
    totalStalls: null,
    stallPrice: 0,
    stallSize: '10x10 ft',
    b2bTicketPrice: 0,
    b2bStayFee: 0,
    b2cTicketPrice: 0,
    b2cStayFee: 0,
    couponId: '',
  };
  selectedEvent: Event | null = null;
  
  // Coupon properties
  coupons: Coupon[] = [];
  loadingCoupons: boolean = false;

  // Organizer properties
  organizers: any[] = [];
  loadingOrganizers: boolean = false;

  galleryModal: any;
  selectedEventForGallery: Event | null = null;
  galleryItems: {
    images: GalleryItem[];
    videos: GalleryItem[];
  } = {
    images: [],
    videos: [],
  };
  galleryLoading: boolean = false;
  activeGalleryTab: 'images' | 'videos' = 'images';

  // Event list data
  events: EventResponse = {
    success: false,
    message: '',
    events: [],
    total: 0,
    page: 1,
    limit: 10,
  };

  loading: boolean = false;
  eventsLoading: boolean = false;
  editLoading: boolean = false;

  // Search and pagination
  searchQuery: string = '';
  selectedStatus: string = '';
  payload: {
    search: string;
    page: number;
    limit: number;
    isActive: string | undefined;
  } = {
    search: '',
    page: 1,
    limit: 10,
    isActive: undefined,
  };

  paginationConfig = {
    id: 'events-pagination',
  };

  sponsorTiers = [
    { label: 'Platinum', value: 'platinum' },
    { label: 'Gold', value: 'gold' },
    { label: 'Silver', value: 'silver' },
    { label: 'Bronze', value: 'bronze' },
  ];

   // Add these new properties for UPI payment functionality
  paymentModal: any;
  selectedEventForPayment: Event | null = null;
  upiPaymentForm: {
    id?: string;
    eventId: string;
    amount: number;
    qrCodeUrl: string;
    qrCodeFile: File | null;
    status: 'pending' | 'completed' | 'failed';
    isApproved: boolean;
  } = {
    eventId: '',
    amount: 0,
    qrCodeUrl: '',
    qrCodeFile: null,
    status: 'pending',
    isApproved: false
  };

  paymentLoading: boolean = false;
  existingUpiPayment: UpiPaymentDetails | null = null;

  paymentStatuses = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' }
  ];


  // Track which fields have been touched/interacted with
  touchedFields: any = {
    title: false,
    description: false,
    startDate: false,
    endDate: false,
    startTime: false,
    endTime: false,
    location: false,
    venue: false,
    eventType: false,
    capacity: false,
    organizerId: false,
    totalStalls: false,
    sponsors: false,
    speakers: false,
  };

  editTouchedFields: any = {};

  // Validation error messages
  validationErrors: any = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    venue: '',
    eventType: '',
    capacity: '',
    organizerId: '',
    totalStalls: '',
    sponsors: '',
    speakers: '',
  };

  editValidationErrors: any = {};

  // Event types
  eventTypes = [
    { label: 'offline', value: 'offline' },
    { label: 'online', value: 'online' },
    // { label: 'hybrid', value: 'hybrid' },
  ];

  statusOptions = [
    { label: 'All Events', value: '' },
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ];

  public Math = Math;
  imageurl = environment.imageUrl;
  private searchSubject = new Subject<string>();
  eventModal: any;
  editEventModal: any;
  viewEventModal: any;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private couponService: CouponService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchEvents();
    });
  }

  ngOnInit(): void {
    this.fetchEvents();
    this.fetchCoupons();
    this.fetchOrganizers();
  }
  
  async fetchCoupons(): Promise<void> {
    this.loadingCoupons = true;
    try {
      const requestData = {
        page: 1,
        limit: 100 // Fetch more coupons for dropdown
      };
      
      const response = await this.couponService.getCoupons(requestData);
      
      if (response && response.success && response.data?.coupons) {
        // Filter only active and non-deleted coupons
        this.coupons = response.data.coupons.filter((coupon: Coupon) => coupon.isActive && !coupon.isDeleted);
      } else if (response && response.data?.coupons) {
        this.coupons = response.data.coupons.filter((coupon: Coupon) => coupon.isActive && !coupon.isDeleted);
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching coupons:', error);
      swalHelper.showToast('Failed to fetch coupons', 'error');
    } finally {
      this.loadingCoupons = false;
    }
  }

  async fetchOrganizers(): Promise<void> {
    this.loadingOrganizers = true;
    try {
      const requestData = {
        page: 1,
        limit: 1000, // Fetch more users for organizer dropdown
        search: ''
      };
      
      const response = await this.authService.getUsers(requestData);
      
      if (response && response.docs) {
        this.organizers = response.docs.map((user: any) => {
          const displayName = user.name || user.business_name || user.email || 'Unknown';
          const businessName = user.business_name ? ` (${user.business_name})` : '';
          return {
            _id: user._id,
            name: `${displayName}${businessName}`,
            email: user.email || '',
            business_name: user.business_name || ''
          };
        });
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching organizers:', error);
      swalHelper.showToast('Failed to fetch organizers', 'error');
    } finally {
      this.loadingOrganizers = false;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('eventModal');
      if (modalElement) {
        this.eventModal = new bootstrap.Modal(modalElement);
      }

      const editModalElement = document.getElementById('editEventModal');
      if (editModalElement) {
        this.editEventModal = new bootstrap.Modal(editModalElement);
      }

      const viewModalElement = document.getElementById('viewEventModal');
      if (viewModalElement) {
        this.viewEventModal = new bootstrap.Modal(viewModalElement);
      }
      const galleryModalElement = document.getElementById('galleryModal');
      if (galleryModalElement) {
        this.galleryModal = new bootstrap.Modal(galleryModalElement);
      }
      const paymentModalElement = document.getElementById('paymentModal');
      if (paymentModalElement) {
        this.paymentModal = new bootstrap.Modal(paymentModalElement);
      }
    }, 300);
  }

  ngOnDestroy(): void {
  if (this.upiPaymentForm.qrCodeUrl && this.upiPaymentForm.qrCodeUrl.startsWith('blob:')) {
    URL.revokeObjectURL(this.upiPaymentForm.qrCodeUrl);
  }
}

  async fetchEvents(): Promise<void> {
    this.eventsLoading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        isActive: this.payload.isActive,
      };

      const response = await this.eventService.newGetEvents(requestData);

      if (response && response.success) {
        this.events = {
          success: response.success,
          message: response.message,
          events: response.data.events || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 10,
        };
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      swalHelper.showToast('Failed to fetch events', 'error');
      this.events = {
        success: false,
        message: 'Error',
        events: [],
        total: 0,
        page: this.payload.page,
        limit: this.payload.limit,
      };
    } finally {
      this.eventsLoading = false;
      this.cdr.detectChanges();
    }
  }

  onSearch(): void {
    this.payload.page = 1;
    this.payload.search = this.searchQuery;
    this.searchSubject.next(this.searchQuery);
  }

  onStatusChange(): void {
    this.payload.page = 1;
    this.payload.isActive =
      this.selectedStatus === '' ? undefined : this.selectedStatus;
    this.fetchEvents();
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchEvents();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchEvents();
    }
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.eventForm.bannerImage = file;
    }
  }

  onEditFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editEventForm.bannerImage = file;
    }
  }

  // Validation methods
  validateTitle(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.title) return true;

    const title = form.title?.trim();
    if (!title) {
      errors.title = 'Event title is required';
      return false;
    }
    if (title.length < 3) {
      errors.title = 'Event title must be at least 3 characters';
      return false;
    }
    errors.title = '';
    return true;
  }

  validateDescription(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.description) return true;

    const description = form.description?.trim();
    if (!description) {
      errors.description = 'Event description is required';
      return false;
    }
    if (description.length < 10) {
      errors.description = 'Event description must be more than 10 characters';
      return false;
    }
    errors.description = '';
    return true;
  }

  onEventTypeChange(isEdit: boolean = false): void {
    const form = isEdit ? this.editEventForm : this.eventForm;
    
    if (form.eventType === 'online') {
      // Auto-fill location with "online"
      form.location = 'online';
      
      // Prefix venue with "zoom" if it doesn't already start with it
      if (!form.venue || !form.venue.toLowerCase().startsWith('zoom')) {
        form.venue = form.venue ? `zoom ${form.venue}` : 'zoom';
      }
    } else {
      // Clear location if changed from online to offline/hybrid
      if (form.location === 'online') {
        form.location = '';
      }
      // Remove zoom prefix if venue starts with zoom
      if (form.venue && form.venue.toLowerCase().startsWith('zoom ')) {
        form.venue = form.venue.substring(5); // Remove "zoom " prefix
      } else if (form.venue && form.venue.toLowerCase() === 'zoom') {
        form.venue = '';
      }
    }
    
    this.cdr.detectChanges();
  }

  validateDates(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.startDate && !touched.endDate) return true;

    if (!form.startDate) {
      errors.startDate = 'Start date is required';
      return false;
    }

    if (!form.endDate) {
      errors.endDate = 'End date is required';
      return false;
    }

    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);

    if (startDate > endDate) {
      errors.endDate = 'End date must be after start date';
      return false;
    }

    errors.startDate = '';
    errors.endDate = '';
    return true;
  }

  validateTimes(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.startTime && !touched.endTime) return true;

    if (!form.startTime) {
      errors.startTime = 'Start time is required';
      return false;
    }

    if (!form.endTime) {
      errors.endTime = 'End time is required';
      return false;
    }

    errors.startTime = '';
    errors.endTime = '';
    return true;
  }

  validateLocation(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.location) return true;

    const location = form.location?.trim();
    if (!location) {
      errors.location = 'Location is required';
      return false;
    }
    errors.location = '';
    return true;
  }

  validateMapUrl(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.mapUrl) return true;

    const mapUrl = form.mapUrl?.trim();
    
    // If event is online, validate Zoom URL - only check for https: validation
    if (form.eventType === 'online') {
      if (!mapUrl) {
        errors.mapUrl = 'Zoom URL is required for online events';
        return false;
      }
      
      // Only validate that URL starts with https: or http:
      if (!mapUrl.toLowerCase().startsWith('https://') && !mapUrl.toLowerCase().startsWith('http://')) {
        errors.mapUrl = 'Please enter a valid URL starting with https:// or http://';
        return false;
      }
    } else {
      // For offline/hybrid events, URL is optional but if provided should start with https: or http:
      if (mapUrl) {
        if (!mapUrl.toLowerCase().startsWith('https://') && !mapUrl.toLowerCase().startsWith('http://')) {
          errors.mapUrl = 'Please enter a valid URL starting with https:// or http://';
          return false;
        }
      }
    }
    
    errors.mapUrl = '';
    return true;
  }

  validateCapacity(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.capacity) return true;

    if (!form.capacity || form.capacity === null || form.capacity === undefined) {
      errors.capacity = 'Capacity is required';
      return false;
    }

    if (form.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
      return false;
    }
    errors.capacity = '';
    return true;
  }

  validateOrganizer(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!touched.organizerId) return true;

    if (!form.organizerId || form.organizerId.trim() === '') {
      errors.organizerId = 'Organizer is required';
      return false;
    }
    errors.organizerId = '';
    return true;
  }

  // Sponsor validation methods
  validateSponsors(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!form.sponsors || form.sponsors.length === 0) {
      errors.sponsors = '';
      return true;
    }

    let isValid = true;
    form.sponsors.forEach((sponsor: Sponsor, index: number) => {
      if (!this.validateSponsorName(index, isEdit)) isValid = false;
      if (!this.validateSponsorWebsite(index, isEdit)) isValid = false;
      if (!this.validateSponsorTier(index, isEdit)) isValid = false;
      if (!this.validateSponsorContactEmail(index, isEdit)) isValid = false;
      if (!this.validateSponsorLogo(index, isEdit)) isValid = false;
      if (!this.validateSponsorDescription(index, isEdit)) isValid = false;
    });

    return isValid;
  }

  validateSponsorName(sponsorIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.name || !sponsor.name.trim()) {
      errors[`sponsor_${sponsorIndex}_name`] = 'Sponsor name is required';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_name`] = '';
    return true;
  }

  validateSponsorWebsite(
    sponsorIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.website || !sponsor.website.trim()) {
      errors[`sponsor_${sponsorIndex}_website`] = 'Sponsor website is required';
      return false;
    }
    const urlRegex = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!urlRegex.test(sponsor.website)) {
      errors[`sponsor_${sponsorIndex}_website`] = 'Please enter a valid URL';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_website`] = '';
    return true;
  }

  validateSponsorTier(sponsorIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.tier || !sponsor.tier.trim()) {
      errors[`sponsor_${sponsorIndex}_tier`] = 'Sponsor tier is required';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_tier`] = '';
    return true;
  }

  validateSponsorContactEmail(
    sponsorIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.contactEmail || !sponsor.contactEmail.trim()) {
      errors[`sponsor_${sponsorIndex}_contactEmail`] =
        'Sponsor contact email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sponsor.contactEmail)) {
      errors[`sponsor_${sponsorIndex}_contactEmail`] =
        'Please enter a valid email address';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_contactEmail`] = '';
    return true;
  }

  validateSponsorLogo(sponsorIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.logo) {
      errors[`sponsor_${sponsorIndex}_logo`] = 'Sponsor logo is required';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_logo`] = '';
    return true;
  }

  validateSponsorDescription(
    sponsorIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const sponsor = form.sponsors[sponsorIndex];
    if (!sponsor || !sponsor.description || !sponsor.description.trim()) {
      errors[`sponsor_${sponsorIndex}_description`] =
        'Sponsor description is required';
      return false;
    }
    errors[`sponsor_${sponsorIndex}_description`] = '';
    return true;
  }

  // Speaker validation methods
  validateSpeakers(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    if (!form.speakers || form.speakers.length === 0) {
    errors.speakers = ''; // Clear error instead of setting it
    return true; // Return true instead of false
  }

    let isValid = true;
    form.speakers.forEach((speaker: Speaker, index: number) => {
      if (!this.validateSpeakerName(index, isEdit)) isValid = false;
      if (!this.validateSpeakerEmail(index, isEdit)) isValid = false;
      if (!this.validateSpeakerBio(index, isEdit)) isValid = false;
      if (!this.validateSpeakerPhoto(index, isEdit)) isValid = false;
      if (!this.validateSpeakerDate(index, isEdit)) isValid = false;
      if (!this.validateSpeakerSocialLinks(index, isEdit)) isValid = false;
    });

    return isValid;
  }

  validateSpeakerName(speakerIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.name || !speaker.name.trim()) {
      errors[`speaker_${speakerIndex}_name`] = 'Speaker name is required';
      return false;
    }
    errors[`speaker_${speakerIndex}_name`] = '';
    return true;
  }

  validateSpeakerEmail(speakerIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.email || !speaker.email.trim()) {
      errors[`speaker_${speakerIndex}_email`] = 'Speaker email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(speaker.email)) {
      errors[`speaker_${speakerIndex}_email`] =
        'Please enter a valid email address';
      return false;
    }
    errors[`speaker_${speakerIndex}_email`] = '';
    return true;
  }

  validateSpeakerBio(speakerIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.bio || !speaker.bio.trim()) {
      errors[`speaker_${speakerIndex}_bio`] = 'Speaker bio is required';
      return false;
    }
    errors[`speaker_${speakerIndex}_bio`] = '';
    return true;
  }

  validateSpeakerPhoto(speakerIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.photo) {
      errors[`speaker_${speakerIndex}_photo`] = 'Speaker photo is required';
      return false;
    }
    errors[`speaker_${speakerIndex}_photo`] = '';
    return true;
  }

  validateSpeakerDate(speakerIndex: number, isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.date) {
      errors[`speaker_${speakerIndex}_date`] = 'Speaker date is required';
      return false;
    }
    errors[`speaker_${speakerIndex}_date`] = '';
    return true;
  }

  validateSpeakerSocialLinks(
    speakerIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const speaker = form.speakers[speakerIndex];
    if (!speaker || !speaker.socialLinks) {
      errors[`speaker_${speakerIndex}_socialLinks`] =
        'At least one social link is required';
      return false;
    }

    const { linkedin, twitter, website, instagram } = speaker.socialLinks;
    const hasAtLeastOneLink =
      linkedin?.trim() ||
      twitter?.trim() ||
      website?.trim() ||
      instagram?.trim();
    if (!hasAtLeastOneLink) {
      errors[`speaker_${speakerIndex}_socialLinks`] =
        'At least one social link is required';
      return false;
    }

    const urlRegex = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (linkedin && !urlRegex.test(linkedin)) {
      errors[`speaker_${speakerIndex}_linkedin`] =
        'Please enter a valid LinkedIn URL';
      return false;
    }
    if (website && !urlRegex.test(website)) {
      errors[`speaker_${speakerIndex}_website`] =
        'Please enter a valid website URL';
      return false;
    }
    if (
      instagram &&
      !instagram.trim().startsWith('@') &&
      !urlRegex.test(instagram)
    ) {
      errors[`speaker_${speakerIndex}_instagram`] =
        'Please enter a valid Instagram handle or URL';
      return false;
    }
    if (twitter && !twitter.trim().startsWith('@') && !urlRegex.test(twitter)) {
      errors[`speaker_${speakerIndex}_twitter`] =
        'Please enter a valid Twitter handle or URL';
      return false;
    }

    errors[`speaker_${speakerIndex}_socialLinks`] = '';
    errors[`speaker_${speakerIndex}_linkedin`] = '';
    errors[`speaker_${speakerIndex}_website`] = '';
    errors[`speaker_${speakerIndex}_instagram`] = '';
    errors[`speaker_${speakerIndex}_twitter`] = '';
    return true;
  }

  // Schedule validation methods
  validateSchedules(isEdit: boolean = false): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    let isValid = true;
    form.schedules.forEach((schedule: Schedule, index: number) => {
      if (!this.validateScheduleTitle(index, isEdit)) isValid = false;
      if (!this.validateScheduleDates(index, isEdit)) isValid = false;
      if (!this.validateScheduleTimes(index, isEdit)) isValid = false;
    });

    return isValid;
  }

  validateScheduleTitle(
    scheduleIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const schedule = form.schedules[scheduleIndex];
    if (!schedule || !schedule.title || !schedule.title.trim()) {
      errors[`schedule_${scheduleIndex}_title`] = 'Schedule title is required';
      return false;
    }
    errors[`schedule_${scheduleIndex}_title`] = '';
    return true;
  }

  validateScheduleDates(
    scheduleIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const schedule = form.schedules[scheduleIndex];
    if (!schedule || !schedule.startDate) {
      errors[`schedule_${scheduleIndex}_startDate`] = 'Start date is required';
      return false;
    }
    if (!schedule || !schedule.endDate) {
      errors[`schedule_${scheduleIndex}_endDate`] = 'End date is required';
      return false;
    }

    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    if (startDate > endDate) {
      errors[`schedule_${scheduleIndex}_endDate`] =
        'End date must be after start date';
      return false;
    }

    errors[`schedule_${scheduleIndex}_startDate`] = '';
    errors[`schedule_${scheduleIndex}_endDate`] = '';
    return true;
  }

  validateScheduleTimes(
    scheduleIndex: number,
    isEdit: boolean = false
  ): boolean {
    const form = isEdit ? this.editEventForm : this.eventForm;
    const errors = isEdit ? this.editValidationErrors : this.validationErrors;

    const schedule = form.schedules[scheduleIndex];
    if (!schedule || !schedule.startTime) {
      errors[`schedule_${scheduleIndex}_startTime`] = 'Start time is required';
      return false;
    }
    if (!schedule || !schedule.endTime) {
      errors[`schedule_${scheduleIndex}_endTime`] = 'End time is required';
      return false;
    }

    errors[`schedule_${scheduleIndex}_startTime`] = '';
    errors[`schedule_${scheduleIndex}_endTime`] = '';
    return true;
  }

  onFieldBlur(
    fieldName: string,
    isEdit: boolean = false,
    index?: number
  ): void {
    const touched = isEdit ? this.editTouchedFields : this.touchedFields;

    if (index !== undefined) {
      touched[`${fieldName}_${index}`] = true;
      if (fieldName.startsWith('sponsor_name')) {
        this.validateSponsorName(index, isEdit);
      } else if (fieldName.startsWith('sponsor_website')) {
        this.validateSponsorWebsite(index, isEdit);
      } else if (fieldName.startsWith('sponsor_tier')) {
        this.validateSponsorTier(index, isEdit);
      } else if (fieldName.startsWith('sponsor_contactEmail')) {
        this.validateSponsorContactEmail(index, isEdit);
      } else if (fieldName.startsWith('sponsor_logo')) {
        this.validateSponsorLogo(index, isEdit);
      } else if (fieldName.startsWith('sponsor_description')) {
        this.validateSponsorDescription(index, isEdit);
      } else if (fieldName.startsWith('speaker_name')) {
        this.validateSpeakerName(index, isEdit);
      } else if (fieldName.startsWith('speaker_email')) {
        this.validateSpeakerEmail(index, isEdit);
      } else if (fieldName.startsWith('speaker_bio')) {
        this.validateSpeakerBio(index, isEdit);
      } else if (fieldName.startsWith('speaker_photo')) {
        this.validateSpeakerPhoto(index, isEdit);
      } else if (fieldName.startsWith('speaker_date')) {
        this.validateSpeakerDate(index, isEdit);
      } else if (fieldName.startsWith('speaker_socialLinks')) {
        this.validateSpeakerSocialLinks(index, isEdit);
      } else if (fieldName.startsWith('schedule_title')) {
        this.validateScheduleTitle(index, isEdit);
      } else if (
        fieldName.startsWith('schedule_startDate') ||
        fieldName.startsWith('schedule_endDate')
      ) {
        this.validateScheduleDates(index, isEdit);
      } else if (
        fieldName.startsWith('schedule_startTime') ||
        fieldName.startsWith('schedule_endTime')
      ) {
        this.validateScheduleTimes(index, isEdit);
      }
    } else {
      touched[fieldName] = true;

      switch (fieldName) {
        case 'title':
          this.validateTitle(isEdit);
          break;
        case 'description':
          this.validateDescription(isEdit);
          break;
        case 'startDate':
        case 'endDate':
          this.validateDates(isEdit);
          break;
        case 'startTime':
        case 'endTime':
          this.validateTimes(isEdit);
          break;
        case 'location':
          this.validateLocation(isEdit);
          break;
        case 'mapUrl':
          this.validateMapUrl(isEdit);
          break;
        case 'capacity':
          this.validateCapacity(isEdit);
          break;
        case 'organizerId':
          this.validateOrganizer(isEdit);
          break;
        case 'sponsors':
          this.validateSponsors(isEdit);
          break;
        case 'speakers':
          this.validateSpeakers(isEdit);
          break;
      }
    }
  }

  // Schedule management methods
  addSchedule(): void {
    const newSchedule: Schedule = {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      speakerId: null,
      location: '',
    };
    this.eventForm.schedules.push(newSchedule);
  }

  removeSchedule(index: number): void {
    this.eventForm.schedules.splice(index, 1);
  }

  getAvailableSpeakers(): any[] {
    if (!this.eventForm.speakers || !Array.isArray(this.eventForm.speakers)) {
      return [];
    }

    return this.eventForm.speakers
      .map((speaker: Speaker, index: number) => ({
        name: speaker.name || '',
        value: speaker.name || '',
        index: index,
      }))
      .filter((speaker: { name: string }) => speaker.name.trim() !== '');
  }

  calculateScheduleDuration(schedule: Schedule): string {
    if (
      !schedule.startDate ||
      !schedule.startTime ||
      !schedule.endDate ||
      !schedule.endTime
    ) {
      return 'Set start and end times';
    }

    const startDateTime = new Date(
      `${schedule.startDate}T${schedule.startTime}`
    );
    const endDateTime = new Date(`${schedule.endDate}T${schedule.endTime}`);

    if (endDateTime <= startDateTime) {
      return 'Invalid time range';
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  // Sponsor management methods
  addSponsor(): void {
    const newSponsor: Sponsor = {
      name: '',
      logo: null,
      website: '',
      tier: '',
      description: '',
      contactEmail: '',
    };
    this.eventForm.sponsors.push(newSponsor);
  }

  removeSponsor(index: number): void {
    this.eventForm.sponsors.splice(index, 1);
  }

  onSponsorLogoChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.eventForm.sponsors[index].logo = file;
      this.onFieldBlur(`sponsor_logo_${index}`, false, index);
    }
  }

  // Speaker management methods
  addSpeaker(): void {
    const newSpeaker: Speaker = {
      name: '',
      bio: '',
      photo: null,
      email: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        website: '',
        instagram: '',
      },
      date: '',
    };
    this.eventForm.speakers.push(newSpeaker);
  }

  removeSpeaker(index: number): void {
    this.eventForm.speakers.splice(index, 1);
  }

  onSpeakerPhotoChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.eventForm.speakers[index].photo = file;
      this.onFieldBlur(`speaker_photo_${index}`, false, index);
    }
  }

  // Google Maps integration
  openGoogleMapsSearch(): void {
    const searchQuery =
      this.eventForm.location || this.eventForm.venue || 'location';
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  }

  getEmbedMapUrl(mapUrl: string): SafeResourceUrl | null {
    if (!mapUrl) return null;

    let embedUrl = '';

    if (mapUrl.includes('google.com/maps')) {
      if (mapUrl.includes('@')) {
        const coordMatch = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch) {
          embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0!2d${coordMatch[2]}!3d${coordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2sus!4v1609459200000!5m2!1sen!2sus`;
        }
      } else if (mapUrl.includes('place/') || mapUrl.includes('search/')) {
        const placeMatch = mapUrl.match(/place\/([^\/]+)/);
        const searchMatch = mapUrl.match(/search\/([^\/\?]+)/);
        const query = placeMatch
          ? placeMatch[1]
          : searchMatch
          ? searchMatch[1]
          : '';
        if (query) {
          embedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
            query
          )}`;
        }
      }
    }

    if (!embedUrl && mapUrl.includes('embed')) {
      embedUrl = mapUrl;
    }

    if (!embedUrl) {
      const location = this.eventForm.location || 'location';
      embedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
        location
      )}`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }


async createEvent(): Promise<void> {
  try {
    this.markAllFieldsAsTouched();

    if (!this.validateFormForSubmission()) {
      swalHelper.showToast('Please fix all validation errors', 'warning');
      return;
    }

    this.loading = true;
    const formData = new FormData();

    // Basic fields
    const basicFields = [
      'title',
      'description',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'location',
      'venue',
      'mapUrl',
      'eventType',
      'capacity',
    ];

    basicFields.forEach((key) => {
      if (
        this.eventForm[key] !== null &&
        this.eventForm[key] !== undefined &&
        this.eventForm[key] !== ''
      ) {
        formData.append(key, this.eventForm[key].toString());
      }
    });

    // Organizer (mandatory)
    if (this.eventForm.organizerId) {
      formData.append('organizerId', this.eventForm.organizerId);
    }

    // Stalls (optional)
    if (this.eventForm.totalStalls !== null && this.eventForm.totalStalls !== undefined && this.eventForm.totalStalls > 0) {
      formData.append('totalStalls', this.eventForm.totalStalls.toString());
      if (this.eventForm.stallPrice) {
        formData.append('stallPrice', this.eventForm.stallPrice.toString());
      }
      if (this.eventForm.stallSize) {
        formData.append('stallSize', this.eventForm.stallSize);
      }
    }

    // Pricing
    const parsedPricing = [
      { businessType: 'B2B', ticketPrice: parseFloat(this.eventForm.b2bTicketPrice) || 0, stayFee: parseFloat(this.eventForm.b2bStayFee) || 0 },
      { businessType: 'B2C', ticketPrice: parseFloat(this.eventForm.b2cTicketPrice) || 0, stayFee: parseFloat(this.eventForm.b2cStayFee) || 0 }
    ];
    formData.append('pricing', JSON.stringify(parsedPricing));

    // Calculate isPaid based on total pricing
    const totalPrice = (parsedPricing[0].ticketPrice + parsedPricing[0].stayFee + parsedPricing[1].ticketPrice + parsedPricing[1].stayFee);
    const isPaid = totalPrice > 0;
    formData.append('isPaid', isPaid.toString());

    // Banner Image
    if (this.eventForm.bannerImage instanceof File) {
      formData.append('bannerImage', this.eventForm.bannerImage);
    }

    // Process sponsors
    const sponsorsArray = Array.isArray(this.eventForm.sponsors)
      ? this.eventForm.sponsors
      : [];
    const processedSponsors = [];

    for (let i = 0; i < sponsorsArray.length; i++) {
      const sponsor = sponsorsArray[i];

      // Add sponsor logo to FormData with correct field name
      if (sponsor.logo instanceof File) {
        formData.append('sponsorLogo', sponsor.logo); // Use 'sponsorLogo' without index
      }

      // Prepare sponsor data without the file
      const sponsorData = {
        name: sponsor.name || '',
        logo: '', // Will be populated by backend
        website: sponsor.website || '',
        tier: sponsor.tier || 'bronze',
        description: sponsor.description || '',
        contactEmail: sponsor.contactEmail || '',
      };

      processedSponsors.push(sponsorData);
    }
    formData.append('sponsors', JSON.stringify(processedSponsors));

    // Process speakers
    const speakersArray = Array.isArray(this.eventForm.speakers)
      ? this.eventForm.speakers
      : [];
    const processedSpeakers = [];

    for (let i = 0; i < speakersArray.length; i++) {
      const speaker = speakersArray[i];

      // Add speaker photo to FormData with correct field name
      if (speaker.photo instanceof File) {
        formData.append('speakerPhoto', speaker.photo); // Use 'speakerPhoto' without index
      }

      // Prepare speaker data without the file
      const speakerData = {
        name: speaker.name || '',
        bio: speaker.bio || '',
        photo: '', // Will be populated by backend
        email: speaker.email || '',
        socialLinks: {
          linkedin: speaker.socialLinks?.linkedin || '',
          twitter: speaker.socialLinks?.twitter || '',
          website: speaker.socialLinks?.website || '',
          instagram: speaker.socialLinks?.instagram || '',
        },
        date: speaker.date || null,
      };

      processedSpeakers.push(speakerData);
    }
    formData.append('speakers', JSON.stringify(processedSpeakers));

    // Process schedules
    const schedulesArray = Array.isArray(this.eventForm.schedules)
      ? this.eventForm.schedules
      : [];
    const processedSchedules = schedulesArray.map((schedule: any) => ({
      title: schedule?.title || '',
      description: schedule?.description || '',
      startTime:
        schedule?.startDate && schedule?.startTime
          ? new Date(`${schedule.startDate}T${schedule.startTime}`).toISOString()
          : null,
      endTime:
        schedule?.endDate && schedule?.endTime
          ? new Date(`${schedule.endDate}T${schedule.endTime}`).toISOString()
          : null,
      speakerId: schedule?.speakerId || null,
      location: schedule?.location || '',
    }));
    formData.append('schedules', JSON.stringify(processedSchedules));

    // Handle coupons - send as array even if single select
    const couponId = this.eventForm.couponId;
    if (couponId && couponId.trim() !== '') {
      formData.append('coupons', JSON.stringify([couponId]));
    } else {
      // If no coupon selected, send empty array
      formData.append('coupons', JSON.stringify([]));
    }

    // Debug FormData contents
    console.log('FormData contents:');
    formData.forEach((value, key) => {
      console.log(key, value instanceof File ? `File: ${value.name}` : value);
    });

    const response = await this.eventService.newCreateEvent(formData);

    if (response && response.success) {
      swalHelper.showToast('Event created successfully', 'success');
      this.closeModal();
      this.resetForm();
      this.fetchEvents();
    } else {
      swalHelper.showToast(
        response.message || 'Failed to create event',
        'error'
      );
    }
  } catch (error) {
    console.error('Error creating event:', error);
    swalHelper.showToast('Failed to create event', 'error');
  } finally {
    this.loading = false;
  }
}
async updateEvent(): Promise<void> {
  try {
    this.markAllEditFieldsAsTouched();

    if (!this.validateEditFormForSubmission()) {
      swalHelper.showToast('Please fix all validation errors', 'warning');
      return;
    }

    this.editLoading = true;
    const formData = new FormData();

    formData.append('id', this.selectedEvent!._id);

    const basicFields = [
      'title',
      'description',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'location',
      'venue',
      'mapUrl',
      'eventType',
      'capacity',
    ];

    basicFields.forEach((key) => {
      if (
        this.editEventForm[key] !== null &&
        this.editEventForm[key] !== undefined &&
        this.editEventForm[key] !== ''
      ) {
        formData.append(key, this.editEventForm[key].toString());
      }
    });

    // Organizer (mandatory)
    if (this.editEventForm.organizerId) {
      formData.append('organizerId', this.editEventForm.organizerId);
    }

    // Stalls (optional)
    if (this.editEventForm.totalStalls !== null && this.editEventForm.totalStalls !== undefined) {
      formData.append('totalStalls', this.editEventForm.totalStalls.toString());
      if (this.editEventForm.stallPrice !== undefined) {
        formData.append('stallPrice', this.editEventForm.stallPrice.toString());
      }
      if (this.editEventForm.stallSize) {
        formData.append('stallSize', this.editEventForm.stallSize);
      }
    }

    // Pricing
    const parsedPricing = [
      { businessType: 'B2B', ticketPrice: parseFloat(this.editEventForm.b2bTicketPrice) || 0, stayFee: parseFloat(this.editEventForm.b2bStayFee) || 0 },
      { businessType: 'B2C', ticketPrice: parseFloat(this.editEventForm.b2cTicketPrice) || 0, stayFee: parseFloat(this.editEventForm.b2cStayFee) || 0 }
    ];
    formData.append('pricing', JSON.stringify(parsedPricing));

    // Calculate isPaid based on total pricing
    const totalPrice = (parsedPricing[0].ticketPrice + parsedPricing[0].stayFee + parsedPricing[1].ticketPrice + parsedPricing[1].stayFee);
    const isPaid = totalPrice > 0;
    formData.append('isPaid', isPaid.toString());

    // Banner Image
    if (this.editEventForm.bannerImage instanceof File) {
      formData.append('bannerImage', this.editEventForm.bannerImage);
    }

    // Process sponsors
    const sponsorsArray = Array.isArray(this.editEventForm.sponsors)
      ? this.editEventForm.sponsors
      : [];
    const processedSponsors: any[] = [];

    for (let i = 0; i < sponsorsArray.length; i++) {
      const sponsor = sponsorsArray[i];
      const sponsorData: any = {
        name: sponsor?.name || '',
        logo: sponsor?.logo instanceof File ? '' : (sponsor?.logo || ''),
        website: sponsor?.website || '',
        tier: sponsor?.tier || 'bronze',
        description: sponsor?.description || '',
        contactEmail: sponsor?.contactEmail || '',
      };

      if (sponsor?.logo instanceof File) {
        formData.append('sponsorLogo', sponsor.logo); // Use 'sponsorLogo' without index
      }

      processedSponsors.push(sponsorData);
    }
    formData.append('sponsors', JSON.stringify(processedSponsors));

    // Process speakers
    const speakersArray = Array.isArray(this.editEventForm.speakers)
      ? this.editEventForm.speakers
      : [];
    const processedSpeakers: any[] = [];

    for (let i = 0; i < speakersArray.length; i++) {
      const speaker = speakersArray[i];
      const speakerData: any = {
        name: speaker?.name || '',
        bio: speaker?.bio || '',
        photo: speaker?.photo instanceof File ? '' : (speaker?.photo || ''),
        email: speaker?.email || '',
        socialLinks: {
          linkedin: speaker?.socialLinks?.linkedin || '',
          twitter: speaker?.socialLinks?.twitter || '',
          website: speaker?.socialLinks?.website || '',
          instagram: speaker?.socialLinks?.instagram || '',
        },
        date: speaker?.date || null,
      };

      if (speaker?.photo instanceof File) {
        formData.append('speakerPhoto', speaker.photo); // Use 'speakerPhoto' without index
      }

      processedSpeakers.push(speakerData);
    }
    formData.append('speakers', JSON.stringify(processedSpeakers));

    // Process schedules
    const schedulesArray = Array.isArray(this.editEventForm.schedules)
      ? this.editEventForm.schedules
      : [];
    const processedSchedules = schedulesArray.map((schedule: any) => ({
      title: schedule?.title || '',
      description: schedule?.description || '',
      startTime:
        schedule?.startDate && schedule?.startTime
          ? new Date(`${schedule.startDate}T${schedule.startTime}`).toISOString()
          : null,
      endTime:
        schedule?.endDate && schedule?.endTime
          ? new Date(`${schedule.endDate}T${schedule.endTime}`).toISOString()
          : null,
      speakerId: schedule?.speakerId || null,
      location: schedule?.location || '',
    }));
    formData.append('schedules', JSON.stringify(processedSchedules));

    // Handle coupons - send as array even if single select
    const couponId = this.editEventForm.couponId;
    if (couponId && couponId.trim() !== '') {
      formData.append('coupons', JSON.stringify([couponId]));
    } else {
      // If no coupon selected, send empty array
      formData.append('coupons', JSON.stringify([]));
    }

    // Debug FormData contents
    console.log('FormData contents for update:');
    formData.forEach((value, key) => {
      console.log(key, value instanceof File ? `File: ${value.name}` : value);
    });

    const response = await this.eventService.newUpdateEvent(formData);

    if (response && response.success) {
      swalHelper.showToast('Event updated successfully', 'success');
      this.closeEditModal();
      this.fetchEvents();
    } else {
      swalHelper.showToast(
        response.message || 'Failed to update event',
        'error'
      );
    }
  } catch (error) {
    console.error('Error updating event:', error);
    swalHelper.showToast('Failed to update event', 'error');
  } finally {
    this.editLoading = false;
  }
}
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete Event',
        'Are you sure you want to delete this event? This action cannot be undone.',
        'warning'
      );

      if (result.isConfirmed) {
        this.loading = true;
        const response = await this.eventService.newDeleteEvent({
          id: eventId,
        });

        if (response && response.success) {
          swalHelper.showToast('Event deleted successfully', 'success');
          this.fetchEvents();
        } else {
          swalHelper.showToast(
            response.message || 'Failed to delete event',
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      swalHelper.showToast('Failed to delete event', 'error');
    } finally {
      this.loading = false;
    }
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.touchedFields).forEach((key) => {
      this.touchedFields[key] = true;
    });
    this.eventForm.sponsors.forEach((_: any, index: number) => {
      this.touchedFields[`sponsor_name_${index}`] = true;
      this.touchedFields[`sponsor_website_${index}`] = true;
      this.touchedFields[`sponsor_tier_${index}`] = true;
      this.touchedFields[`sponsor_contactEmail_${index}`] = true;
      this.touchedFields[`sponsor_logo_${index}`] = true;
      this.touchedFields[`sponsor_description_${index}`] = true;
    });
    this.eventForm.speakers.forEach((_: any, index: number) => {
      this.touchedFields[`speaker_name_${index}`] = true;
      this.touchedFields[`speaker_email_${index}`] = true;
      this.touchedFields[`speaker_bio_${index}`] = true;
      this.touchedFields[`speaker_photo_${index}`] = true;
      this.touchedFields[`speaker_date_${index}`] = true;
      this.touchedFields[`speaker_socialLinks_${index}`] = true;
    });
    this.eventForm.schedules.forEach((_: any, index: number) => {
      this.touchedFields[`schedule_title_${index}`] = true;
      this.touchedFields[`schedule_startDate_${index}`] = true;
      this.touchedFields[`schedule_startTime_${index}`] = true;
      this.touchedFields[`schedule_endDate_${index}`] = true;
      this.touchedFields[`schedule_endTime_${index}`] = true;
    });
  }

  markAllEditFieldsAsTouched(): void {
    Object.keys(this.editTouchedFields).forEach((key) => {
      this.editTouchedFields[key] = true;
    });
    this.editEventForm.sponsors.forEach((_: any, index: number) => {
      this.editTouchedFields[`sponsor_name_${index}`] = true;
      this.editTouchedFields[`sponsor_website_${index}`] = true;
      this.editTouchedFields[`sponsor_tier_${index}`] = true;
      this.editTouchedFields[`sponsor_contactEmail_${index}`] = true;
      this.editTouchedFields[`sponsor_logo_${index}`] = true;
      this.editTouchedFields[`sponsor_description_${index}`] = true;
    });
    this.editEventForm.speakers.forEach((_: any, index: number) => {
      this.editTouchedFields[`speaker_name_${index}`] = true;
      this.editTouchedFields[`speaker_email_${index}`] = true;
      this.editTouchedFields[`speaker_bio_${index}`] = true;
      this.editTouchedFields[`speaker_photo_${index}`] = true;
      this.editTouchedFields[`speaker_date_${index}`] = true;
      this.editTouchedFields[`speaker_socialLinks_${index}`] = true;
    });
    this.editEventForm.schedules.forEach((_: any, index: number) => {
      this.editTouchedFields[`schedule_title_${index}`] = true;
      this.editTouchedFields[`schedule_startDate_${index}`] = true;
      this.editTouchedFields[`schedule_startTime_${index}`] = true;
      this.editTouchedFields[`schedule_endDate_${index}`] = true;
      this.editTouchedFields[`schedule_endTime_${index}`] = true;
    });
  }

  validateFormForSubmission(): boolean {
    let isValid = true;

    if (!this.validateTitle()) {
      this.validationErrors.title = 'Event title is required';
      isValid = false;
    }

    if (!this.validateDescription()) {
      this.validationErrors.description = 'Event description is required';
      isValid = false;
    }

    if (!this.validateDates()) {
      isValid = false;
    }

    if (!this.validateTimes()) {
      isValid = false;
    }

    if (!this.validateLocation()) {
      this.validationErrors.location = 'Location is required';
      isValid = false;
    }

    if (!this.validateMapUrl()) {
      isValid = false;
    }

    if (!this.validateCapacity()) {
      this.validationErrors.capacity = 'Capacity is required';
      isValid = false;
    }

    if (!this.validateOrganizer()) {
      this.validationErrors.organizerId = 'Organizer is required';
      isValid = false;
    }

    if (!this.validateSponsors()) {
      isValid = false;
    }


    return isValid;
  }

  validateEditFormForSubmission(): boolean {
    let isValid = true;

    if (!this.validateTitle(true)) {
      this.editValidationErrors.title = 'Event title is required';
      isValid = false;
    }

    if (!this.validateDescription(true)) {
      this.editValidationErrors.description = 'Event description is required';
      isValid = false;
    }

    if (!this.validateDates(true)) {
      isValid = false;
    }

    if (!this.validateTimes(true)) {
      isValid = false;
    }

    if (!this.validateLocation(true)) {
      this.editValidationErrors.location = 'Location is required';
      isValid = false;
    }

    if (!this.validateMapUrl(true)) {
      isValid = false;
    }

    if (!this.validateCapacity(true)) {
      this.editValidationErrors.capacity = 'Capacity is required';
      isValid = false;
    }

    if (!this.validateOrganizer(true)) {
      this.editValidationErrors.organizerId = 'Organizer is required';
      isValid = false;
    }

    if (!this.validateSponsors(true)) {
      isValid = false;
    }

    if (!this.validateSpeakers(true)) {
      isValid = false;
    }

    if (!this.validateSchedules(true)) {
      isValid = false;
    }

    return isValid;
  }

  validateForm(): boolean {
    const basicValid =
      this.eventForm.title?.trim() &&
      this.eventForm.description?.trim() &&
      this.eventForm.startDate &&
      this.eventForm.endDate &&
      this.eventForm.startTime &&
      this.eventForm.endTime &&
      this.eventForm.location?.trim();

    // const sponsorsValid =
    //   this.eventForm.sponsors &&
    //   this.eventForm.sponsors.length > 0 &&
    //   this.eventForm.sponsors.every(
    //     (sponsor: Sponsor) =>
    //       sponsor.name?.trim() &&
    //       sponsor.website?.trim() &&
    //       sponsor.tier?.trim() &&
    //       sponsor.contactEmail?.trim() &&
    //       sponsor.logo &&
    //       sponsor.description?.trim()
    //   );

    // const speakersValid =
    //   this.eventForm.speakers &&
    //   this.eventForm.speakers.length > 0 &&
    //   this.eventForm.speakers.every(
    //     (speaker: Speaker) =>
    //       speaker.name?.trim() &&
    //       speaker.email?.trim() &&
    //       speaker.bio?.trim() &&
    //       speaker.photo &&
    //       speaker.date &&
    //       (speaker.socialLinks.linkedin?.trim() ||
    //         speaker.socialLinks.twitter?.trim() ||
    //         speaker.socialLinks.website?.trim() ||
    //         speaker.socialLinks.instagram?.trim())
    //   );

    // const schedulesValid = this.eventForm.schedules.every(
    //   (schedule: Schedule) =>
    //     schedule.title?.trim() &&
    //     schedule.startDate &&
    //     schedule.startTime &&
    //     schedule.endDate &&
    //     schedule.endTime
    // );

    return basicValid ;
  }

  validateEditForm(): boolean {
    const basicValid =
      this.editEventForm.title?.trim() &&
      this.editEventForm.description?.trim() &&
      this.editEventForm.startDate &&
      this.editEventForm.endDate &&
      this.editEventForm.startTime &&
      this.editEventForm.endTime &&
      this.editEventForm.location?.trim();

    const sponsorsValid =
      this.editEventForm.sponsors &&
      this.editEventForm.sponsors.length > 0 &&
      this.editEventForm.sponsors.some(
        (sponsor: any) => sponsor.name && sponsor.name.trim()
      );

    const speakersValid =
      this.editEventForm.speakers &&
      this.editEventForm.speakers.length > 0 &&
      this.editEventForm.speakers.some(
        (speaker: any) => speaker.name && speaker.name.trim()
      );

    return basicValid ;
  }

  resetForm(): void {
    this.eventForm = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      venue: '',
      mapUrl: '',
      eventType: 'offline',
      capacity: null,
      organizerId: '',
      totalStalls: null,
      stallPrice: 0,
      stallSize: '10x10 ft',
      sponsors: [] as Sponsor[],
      speakers: [] as Speaker[],
      schedules: [] as Schedule[],
      bannerImage: null,
      b2bTicketPrice: 0,
      b2bStayFee: 0,
      b2cTicketPrice: 0,
      b2cStayFee: 0,
      couponId: '',
    };

    this.validationErrors = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      venue: '',
      eventType: '',
      capacity: '',
      organizerId: '',
      totalStalls: '',
      sponsors: '',
      speakers: '',
    };

    this.touchedFields = {
      title: false,
      description: false,
      startDate: false,
      endDate: false,
      startTime: false,
      endTime: false,
      location: false,
      venue: false,
      eventType: false,
      capacity: false,
      organizerId: false,
      totalStalls: false,
      sponsors: false,
      speakers: false,
    };
  }

  viewEvent(event: Event): void {
    this.selectedEvent = event;
    this.showViewModal();
  }

  viewStalls(eventId: string | undefined): void {
    // Get eventId from selectedEvent if not provided
    if (!eventId && this.selectedEvent) {
      eventId = this.selectedEvent._id;
    }
    
    if (!eventId || eventId.trim() === '') {
      console.error('Event ID is empty in viewStalls. Selected event:', this.selectedEvent);
      swalHelper.showToast('Event ID is missing', 'error');
      return;
    }
    
    console.log('Navigating to stalls with eventId:', eventId);
    this.closeViewModal();
    
    // Use setTimeout to ensure modal is closed before navigation
    setTimeout(() => {
      this.router.navigate(['/event-stalls'], { 
        queryParams: { eventId: eventId }
      }).then(() => {
        console.log('Navigation completed to /event-stalls with eventId:', eventId);
      }).catch((error) => {
        console.error('Navigation error:', error);
        swalHelper.showToast('Failed to navigate to stalls page', 'error');
      });
    }, 100);
  }

  // Edit form management methods
  addEditSponsor(): void {
    const newSponsor: Sponsor = {
      name: '',
      logo: null,
      website: '',
      tier: '',
      description: '',
      contactEmail: '',
    };
    this.editEventForm.sponsors.push(newSponsor);
  }

  removeEditSponsor(index: number): void {
    this.editEventForm.sponsors.splice(index, 1);
  }

  addEditSpeaker(): void {
    const newSpeaker: Speaker = {
      name: '',
      bio: '',
      photo: null,
      email: '',
      socialLinks: {
        linkedin: '',
        twitter: '',
        website: '',
        instagram: '',
      },
      date: '',
    };
    this.editEventForm.speakers.push(newSpeaker);
  }

  removeEditSpeaker(index: number): void {
    this.editEventForm.speakers.splice(index, 1);
  }

  addEditSchedule(): void {
    const newSchedule: Schedule = {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      speakerId: null,
      location: '',
    };
    this.editEventForm.schedules.push(newSchedule);
  }

  removeEditSchedule(index: number): void {
    this.editEventForm.schedules.splice(index, 1);
  }

  getEditAvailableSpeakers(): any[] {
    if (
      !this.editEventForm.speakers ||
      !Array.isArray(this.editEventForm.speakers)
    ) {
      return [];
    }

    return this.editEventForm.speakers
      .map((speaker: Speaker, index: number) => ({
        name: speaker.name || '',
        value: speaker.name || '',
        index: index,
      }))
      .filter((speaker: { name: string }) => speaker.name.trim() !== '');
  }

  calculateEditScheduleDuration(schedule: Schedule): string {
    if (
      !schedule.startDate ||
      !schedule.startTime ||
      !schedule.endDate ||
      !schedule.endTime
    ) {
      return 'Set start and end times';
    }

    const startDateTime = new Date(
      `${schedule.startDate}T${schedule.startTime}`
    );
    const endDateTime = new Date(`${schedule.endDate}T${schedule.endTime}`);

    if (endDateTime <= startDateTime) {
      return 'Invalid time range';
    }

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  onEditSponsorLogoChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.editEventForm.sponsors[index].logo = file;
      this.onFieldBlur(`sponsor_logo_${index}`, true, index);
    }
  }

  onEditSpeakerPhotoChange(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      this.editEventForm.speakers[index].photo = file;
      this.onFieldBlur(`speaker_photo_${index}`, true, index);
    }
  }

  editEvent(event: Event): void {
    this.selectedEvent = event;
    this.editEventForm = {
      title: event.title || '',
      description: event.description || '',
      startDate: event.startDate
        ? new Date(event.startDate).toISOString().split('T')[0]
        : '',
      endDate: event.endDate
        ? new Date(event.endDate).toISOString().split('T')[0]
        : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      venue: event.venue || '',
      mapUrl: event.mapUrl || '',
      eventType: event.eventType || 'offline',
      capacity: event.capacity || null,
      organizerId: (event as any).organizerId ? (typeof (event as any).organizerId === 'string' ? (event as any).organizerId : (event as any).organizerId._id) : '',
      totalStalls: (event as any).totalStalls || null,
      stallPrice: (event as any).stalls && (event as any).stalls.length > 0 ? (event as any).stalls[0].price || 0 : 0,
      stallSize: (event as any).stalls && (event as any).stalls.length > 0 ? (event as any).stalls[0].size || '10x10 ft' : '10x10 ft',
      sponsors: JSON.parse(JSON.stringify(event.sponsors || [])),
      speakers: JSON.parse(JSON.stringify(event.speakers || [])),
      schedules: (event.schedules || []).map((schedule) => ({
        title: schedule.title || '',
        description: schedule.description || '',
        startDate: schedule.startTime
          ? new Date(schedule.startTime).toISOString().split('T')[0]
          : '',
        startTime: schedule.startTime
          ? new Date(schedule.startTime).toTimeString().slice(0, 5)
          : '',
        endDate: schedule.endTime
          ? new Date(schedule.endTime).toISOString().split('T')[0]
          : '',
        endTime: schedule.endTime
          ? new Date(schedule.endTime).toTimeString().slice(0, 5)
          : '',
        speakerId: schedule.speakerId || null,
        location: schedule.location || '',
      })),
      couponId: event.coupons && event.coupons.length > 0 ? (typeof event.coupons[0] === 'string' ? event.coupons[0] : event.coupons[0]._id) : '', // Single select, take first one
    };

    if (event.pricing) {
      const b2b = event.pricing.find((p: Pricing) => p.businessType === 'B2B');
      const b2c = event.pricing.find((p: Pricing) => p.businessType === 'B2C');
      this.editEventForm.b2bTicketPrice = b2b?.ticketPrice || 0;
      this.editEventForm.b2bStayFee = b2b?.stayFee || 0;
      this.editEventForm.b2cTicketPrice = b2c?.ticketPrice || 0;
      this.editEventForm.b2cStayFee = b2c?.stayFee || 0;
    }

    this.editValidationErrors = {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      venue: '',
      eventType: '',
      capacity: '',
      organizerId: '',
      totalStalls: '',
      sponsors: '',
      speakers: '',
    };

    this.editTouchedFields = {
      title: false,
      description: false,
      startDate: false,
      endDate: false,
      startTime: false,
      endTime: false,
      location: false,
      venue: false,
      eventType: false,
      capacity: false,
      organizerId: false,
      totalStalls: false,
      sponsors: false,
      speakers: false,
    };

    this.showEditModal();
  }

  convertSchedulesToEdit(schedules: any[]): Schedule[] {
    return schedules.map((schedule) => ({
      title: schedule.title || '',
      description: schedule.description || '',
      startDate: schedule.startTime
        ? new Date(schedule.startTime).toISOString().split('T')[0]
        : '',
      startTime: schedule.startTime
        ? new Date(schedule.startTime).toTimeString().slice(0, 5)
        : '',
      endDate: schedule.endTime
        ? new Date(schedule.endTime).toISOString().split('T')[0]
        : '',
      endTime: schedule.endTime
        ? new Date(schedule.endTime).toTimeString().slice(0, 5)
        : '',
      speakerId: schedule.speakerId || null,
      location: schedule.location || '',
    }));
  }

  showModal(): void {
    if (this.eventModal) {
      this.eventModal.show();
    } else {
      $('#eventModal').modal('show');
    }
  }

  showEditModal(): void {
    if (this.editEventModal) {
      this.editEventModal.show();
    } else {
      $('#editEventModal').modal('show');
    }
  }

  showViewModal(): void {
    if (this.viewEventModal) {
      this.viewEventModal.show();
    } else {
      $('#viewEventModal').modal('show');
    }
  }

  closeModal(): void {
    if (this.eventModal) {
      this.eventModal.hide();
    } else {
      $('#eventModal').modal('hide');
    }
  }

  closeEditModal(): void {
    if (this.editEventModal) {
      this.editEventModal.hide();
    } else {
      $('#editEventModal').modal('hide');
    }
  }

  closeViewModal(): void {
    if (this.viewEventModal) {
      this.viewEventModal.hide();
    } else {
      $('#viewEventModal').modal('hide');
    }
  }

  openEventModal(): void {
    this.resetForm();
    setTimeout(() => {
      this.showModal();
    }, 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string, timeString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString).toLocaleDateString();
    return timeString ? `${date} ${timeString}` : date;
  }

  getFileName(filePath: string | null | undefined): string {
    if (!filePath || typeof filePath !== 'string') return 'No file';
    const parts = filePath.split('/');
    return parts[parts.length - 1] || 'Unknown file';
  }

  editAndCloseView(): void {
    if (this.selectedEvent) {
      this.editEvent(this.selectedEvent);
      this.closeViewModal();
    }
  }

  deleteAndCloseView(): void {
    if (this.selectedEvent) {
      this.deleteEvent(this.selectedEvent._id);
      this.closeViewModal();
    }
  }

  formatScheduleDateTime(dateTimeString: string): string {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  }

  getSpeakerName(speakerId: string): string {
    const speaker = this.selectedEvent?.speakers?.find(
      (s) => s._id === speakerId || s.name === speakerId
    );
    return speaker?.name || 'Unknown Speaker';
  }

  //  openGalleryModal(event: Event): void {
  //   this.selectedEventForGallery = event;
  //   // this.loadEventGallery(event._id);
  //   this.showGalleryModal();
  // }


  async saveItemCaption(item: GalleryItem): Promise<void> {
  if (!item._id || !this.selectedEventForGallery) return; // Only save for existing items

  try {
    const response = await this.eventService.updateGalleryItem({
      eventId: this.selectedEventForGallery._id,
      itemId: item._id,
      caption: item.caption || ''
    });

    if (response && response.success) {
      // Optionally show toast: swalHelper.showToast('Caption updated successfully', 'success');
    } else {
      console.error('Failed to update caption:', response.message);
      // Optionally revert or show error
    }
  } catch (error) {
    console.error('Error updating caption:', error);
    // Optionally show toast: swalHelper.showToast('Failed to update caption', 'error');
  }
}

async loadEventGallery(id: string): Promise<void> {
  this.galleryLoading = true;
  try {
    const response = await this.eventService.newGetEventGallery({ id }); // Pass eventId in an object for POST body

    if (response && response.success) {
      const galleryData = response.data || []; // Assuming response.data is the array of gallery items
      this.galleryItems.images = galleryData.filter((item: GalleryItem) => item.type === 'image');
      this.galleryItems.videos = galleryData.filter((item: GalleryItem) => item.type === 'video');
    } else {
      this.galleryItems = { images: [], videos: [] };
    }
  } catch (error) {
    console.error('Error loading gallery:', error);
    swalHelper.showToast('Failed to load gallery', 'error');
    this.galleryItems = { images: [], videos: [] };
  } finally {
    this.galleryLoading = false;
  }
}

  onGalleryFileChange(event: any, type: 'image' | 'video'): void {
    const files = Array.from(event.target.files) as File[];
    
    files.forEach(file => {
      if (this.validateGalleryFile(file, type)) {
        const newItem: GalleryItem = {
          type: type,
          url: file,
          caption: '',
          uploadedAt: new Date()
        };
        
        if (type === 'image') {
          this.galleryItems.images.push(newItem);
        } else {
          this.galleryItems.videos.push(newItem);
        }
      }
    });
    
    // Reset file input
    event.target.value = '';
  }

  validateGalleryFile(file: File, type: 'image' | 'video'): boolean {
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    
    if (file.size > maxSize) {
      swalHelper.showToast(`File size should be less than ${type === 'image' ? '5MB' : '50MB'}`, 'error');
      return false;
    }

    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];

    if (!allowedTypes.includes(file.type)) {
      swalHelper.showToast(`Invalid file type. Please select a valid ${type} file.`, 'error');
      return false;
    }

    return true;
  }

  removeGalleryItem(index: number, type: 'image' | 'video'): void {
    if (type === 'image') {
      this.galleryItems.images.splice(index, 1);
    } else {
      this.galleryItems.videos.splice(index, 1);
    }
  }

  updateGalleryItemCaption(index: number, type: 'image' | 'video', caption: string): void {
    if (type === 'image') {
      this.galleryItems.images[index].caption = caption;
    } else {
      this.galleryItems.videos[index].caption = caption;
    }
  }

  getGalleryItemPreview(item: GalleryItem): string {
    if (item.url instanceof File) {
      return URL.createObjectURL(item.url);
    }
    return typeof item.url === 'string' ? this.imageurl + item.url : '';
  }

async saveGalleryChanges(): Promise<void> {
  if (!this.selectedEventForGallery) return;

  try {
    this.galleryLoading = true;

    // Collect all new files (both images and videos)
    const newItems = [
      ...this.galleryItems.images.filter(item => item.url instanceof File),
      ...this.galleryItems.videos.filter(item => item.url instanceof File)
    ];

    if (newItems.length === 0) {
      swalHelper.showToast('No new items to upload', 'info');
      this.closeGalleryModal();
      return;
    }

    const formData = new FormData();
    formData.append('id', this.selectedEventForGallery._id);

    newItems.forEach(item => {
      if (item.url instanceof File) {
        formData.append('files', item.url); // Append all files to 'files'
        formData.append('captions[]', item.caption || '');
        formData.append('types[]', item.type);
      }
    });

    const response = await this.eventService.uploadGalleryItem(formData);

    if (response && response.success) {
      swalHelper.showToast('New gallery items uploaded successfully', 'success');
      this.closeGalleryModal();
      // Optionally reload if needed, but since closing modal, it will reload on reopen
    } else {
      swalHelper.showToast(response.message || 'Failed to upload gallery items', 'error');
    }
  } catch (error) {
    console.error('Error uploading gallery items:', error);
    swalHelper.showToast('Failed to upload gallery items', 'error');
  } finally {
    this.galleryLoading = false;
  }
}

// Update openGalleryModal to load the gallery
openGalleryModal(event: Event): void {
  this.selectedEventForGallery = event;
  this.loadEventGallery(event._id);
  this.showGalleryModal();
}

async deleteGalleryItem(item: GalleryItem, type: 'image' | 'video'): Promise<void> {
  if (!this.selectedEventForGallery || !item._id) return;

  try {
    const result = await swalHelper.confirmation(
      'Delete Gallery Item',
      'Are you sure you want to delete this item from the gallery?',
      'warning'
    );

    if (result.isConfirmed) {
      const response = await this.eventService.deleteGalleryItem({
        eventId: this.selectedEventForGallery._id,
        itemId: item._id
      });

      if (response && response.success) {
        swalHelper.showToast('Gallery item deleted successfully', 'success');
        await this.loadEventGallery(this.selectedEventForGallery._id); // Reload to reflect changes
      } else {
        swalHelper.showToast('Failed to delete gallery item', 'error');
      }
    }
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    swalHelper.showToast('Failed to delete gallery item', 'error');
  }
}

  switchGalleryTab(tab: 'images' | 'videos'): void {
    this.activeGalleryTab = tab;
  }

  showGalleryModal(): void {
    if (this.galleryModal) {
      this.galleryModal.show();
    } else {
      $('#galleryModal').modal('show');
    }
  }

  closeGalleryModal(): void {
    if (this.galleryModal) {
      this.galleryModal.hide();
    } else {
      $('#galleryModal').modal('hide');
    }
    
    // Reset gallery data
    this.selectedEventForGallery = null;
    this.galleryItems = { images: [], videos: [] };
    this.activeGalleryTab = 'images';
  }

  // Add these new methods to your component

  // UPI Payment management methods
  openPaymentModal(event: Event): void {
    this.selectedEventForPayment = event;
    this.resetUpiPaymentForm();
    this.upiPaymentForm.eventId = event._id;
    this.upiPaymentForm.amount = event.ticketPrice || 0;
    // this.loadExistingUpiPayment(event._id);
    this.showPaymentModal();
  }

  // async loadExistingUpiPayment(eventId: string): Promise<void> {
  //   try {
  //     this.paymentLoading = true;
  //     const response = await this.eventService.getUpiPaymentDetails(eventId);
      
  //     if (response && response.success && response.data) {
  //       this.existingUpiPayment = response.data;
  //       this.populateUpiPaymentForm(response.data);
  //     } else {
  //       this.existingUpiPayment = null;
  //     }
  //   } catch (error) {
  //     console.error('Error loading UPI payment details:', error);
  //     this.existingUpiPayment = null;
  //   } finally {
  //     this.paymentLoading = false;
  //   }
  // }

  populateUpiPaymentForm(paymentDetails: UpiPaymentDetails): void {
    this.upiPaymentForm = {
      id: paymentDetails._id,
      eventId: paymentDetails.eventId,
      amount: paymentDetails.amount,
      qrCodeUrl: paymentDetails.qrCodeUrl,
      qrCodeFile: null,
      status: paymentDetails.status,
      isApproved: paymentDetails.isApproved
    };
  }

  resetUpiPaymentForm(): void {
    this.upiPaymentForm = {
      eventId: '',
      amount: 0,
      qrCodeUrl: '',
      qrCodeFile: null,
      status: 'pending',
      isApproved: false
    };
    this.existingUpiPayment = null;
  }

  onQrCodeFileChange(event: any): void {
  const file = event.target.files[0];
  if (file && this.validateQrCodeFile(file)) {
    this.upiPaymentForm.qrCodeFile = file;

    // revoke old preview if exists
    if (this.upiPaymentForm.qrCodeUrl && this.upiPaymentForm.qrCodeUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.upiPaymentForm.qrCodeUrl);
    }

    // generate new blob URL for preview
    this.upiPaymentForm.qrCodeUrl = URL.createObjectURL(file);
  }
}

  validateQrCodeFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      swalHelper.showToast('QR Code image size should be less than 5MB', 'error');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      swalHelper.showToast('Invalid file type. Please select a valid image file.', 'error');
      return false;
    }

    return true;
  }

  async saveUpiPaymentDetails(): Promise<void> {
    if (!this.validateUpiPaymentForm()) {
      return;
    }

    try {
      this.paymentLoading = true;
      const formData = new FormData();

      // Add basic fields
      if (this.upiPaymentForm.id) {
        formData.append('id', this.upiPaymentForm.id);
      }
      
      formData.append('eventId', this.upiPaymentForm.eventId);
      // formData.append('amount', this.upiPaymentForm.amount.toString());
      formData.append('paymentMethod', 'upi');
      // formData.append('status', this.upiPaymentForm.status);
      // formData.append('isApproved', this.upiPaymentForm.isApproved.toString());

      // Add QR code file
      if (this.upiPaymentForm.qrCodeFile) {
        formData.append('qrCodeUrl', this.upiPaymentForm.qrCodeFile);
      } else if (this.upiPaymentForm.qrCodeUrl && !this.upiPaymentForm.qrCodeFile) {
        formData.append('qrCodeUrl', this.upiPaymentForm.qrCodeUrl);
      }

      const response = await this.eventService.createOrUpdateUpiPayment(formData);

      if (response && response.success) {
        swalHelper.showToast(
          this.upiPaymentForm.id ? 'UPI payment details updated successfully' : 'UPI payment details created successfully',
          'success'
        );
        this.closePaymentModal();
      } else {
        swalHelper.showToast(response.message || 'Failed to save UPI payment details', 'error');
      }
    } catch (error) {
      console.error('Error saving UPI payment details:', error);
      swalHelper.showToast('Failed to save UPI payment details', 'error');
    } finally {
      this.paymentLoading = false;
    }
  }

  validateUpiPaymentForm(): boolean {
    if (!this.upiPaymentForm.eventId) {
      swalHelper.showToast('Event ID is required', 'error');
      return false;
    }

    if (!this.upiPaymentForm.amount || this.upiPaymentForm.amount <= 0) {
      swalHelper.showToast('Valid amount is required', 'error');
      return false;
    }

    if (!this.upiPaymentForm.qrCodeUrl && !this.upiPaymentForm.qrCodeFile) {
      swalHelper.showToast('QR Code is required for UPI payments', 'error');
      return false;
    }

    return true;
  }

  getQrCodePreview(): string {
  if (this.upiPaymentForm.qrCodeFile) {
    // already set in onQrCodeFileChange
    return this.upiPaymentForm.qrCodeUrl;
  }
  return this.upiPaymentForm.qrCodeUrl
    ? this.upiPaymentForm.qrCodeUrl.startsWith('blob:')
      ? this.upiPaymentForm.qrCodeUrl
      : this.imageurl + this.upiPaymentForm.qrCodeUrl
    : '';
}

  isPaymentButtonEnabled(event: Event): boolean {
    return event.ticketPrice > 0; // Only enable for paid events
  }

  showPaymentModal(): void {
    if (this.paymentModal) {
      this.paymentModal.show();
    } else {
      $('#paymentModal').modal('show');
    }
  }

  closePaymentModal(): void {
    if (this.paymentModal) {
      this.paymentModal.hide();
    } else {
      $('#paymentModal').modal('hide');
    }
    
    // Reset payment data
    this.selectedEventForPayment = null;
    this.resetUpiPaymentForm();
  }

  isCouponObject(coupon: any): boolean {
    return coupon && typeof coupon === 'object' && coupon.title !== undefined;
  }

  getFullRegistrationLink(event: any): string {
  if (!event.registrationLink) return '';
  return `${environment.baseURL}/${event.registrationLink}`;
}

  // Helper method to check if event has organizer info
  hasOrganizerInfo(event: any): boolean {
    return event && event.organizerId && typeof event.organizerId === 'object' && event.organizerId.name !== undefined;
  }

  // Helper method to get organizer name
  getOrganizerName(event: any): string {
    if (!event || !event.organizerId) return 'N/A';
    if (typeof event.organizerId === 'object') {
      return event.organizerId.name || 'N/A';
    }
    return 'N/A';
  }

  // Helper method to get organizer mobile
  getOrganizerMobile(event: any): string {
    if (!event || !event.organizerId) return '';
    if (typeof event.organizerId === 'object') {
      return event.organizerId.mobile_number || '';
    }
    return '';
  }

  // Helper method to get organizer business name
  getOrganizerBusinessName(event: any): string {
    if (!event || !event.organizerId) return '';
    if (typeof event.organizerId === 'object') {
      return event.organizerId.business_name || '';
    }
    return '';
  }

  // Helper method to get organizer email
  getOrganizerEmail(event: any): string {
    if (!event || !event.organizerId) return '';
    if (typeof event.organizerId === 'object') {
      return event.organizerId.email || '';
    }
    return '';
  }

  // Helper method to check if event has stalls
  hasStalls(event: any): boolean {
    return event && event.totalStalls && event.totalStalls > 0;
  }

  // Helper method to get total stalls
  getTotalStalls(event: any): number {
    return event && event.totalStalls ? event.totalStalls : 0;
  }

  // Helper method to get available stalls
  getAvailableStalls(event: any): number {
    return event && event.availableStalls ? event.availableStalls : 0;
  }

  // Helper method to get booked stalls
  getBookedStalls(event: any): number {
    return event && event.bookedStalls ? event.bookedStalls : 0;
  }

  // Helper method to get pending stall requests
  getPendingStallRequests(event: any): number {
    return event && event.pendingStallRequests ? event.pendingStallRequests : 0;
  }
}