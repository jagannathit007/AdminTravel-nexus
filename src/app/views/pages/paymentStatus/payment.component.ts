import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/env/env.local';
import { EventService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import html2canvas from 'html2canvas';

declare var bootstrap: any;

@Component({
  selector: 'app-event-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [EventService],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
})
export class EventPaymentsComponent implements OnInit, AfterViewInit {
  events: any = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
    pagingCounter: 1
  };
  loading: boolean = false;
  searchQuery: string = '';
  paymentScreenshotModal: any;
  selectedPaymentScreenshot: string | null = null;
  registrationDetailsModal: any;
  selectedRegistrationDetails: any | null = null;

  // Filter options
  selectedEventType: string = '';
  selectedEventPrice: string = '';

  eventTypeOptions = [
    { value: '', label: 'All Event Types' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    // { value: 'hybrid', label: 'Hybrid' }
  ];

  eventPriceOptions = [
    { value: '', label: 'All Prices' },
    { value: 'false', label: 'Free' },
    { value: 'true', label: 'Paid' }
  ];

  private searchSubject = new Subject<string>();

  payload = {
    search: '',
    page: 1,
    limit: 10,
    eventType: '',
    isPaid: undefined as any
  };

  Math = Math;

  constructor(
    private eventService: EventService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchEvents();
    });
  }

  ngOnInit(): void {
    this.fetchEvents();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const paymentScreenshotModalElement = document.getElementById('paymentScreenshotModal');
      if (paymentScreenshotModalElement) {
        this.paymentScreenshotModal = new bootstrap.Modal(paymentScreenshotModalElement);
      }
      
      const registrationDetailsModalElement = document.getElementById('registrationDetailsModal');
      if (registrationDetailsModalElement) {
        this.registrationDetailsModal = new bootstrap.Modal(registrationDetailsModalElement);
      }
      
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchEvents(): Promise<void> {
    this.loading = true;
    try {
      const requestData: any = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search
      };

      // Add eventType filter if selected
      if (this.payload.eventType && this.payload.eventType.trim() !== '') {
        requestData.eventType = this.payload.eventType;
      }

      // Add isPaid filter if selected
      if (this.payload.isPaid !== undefined && this.payload.isPaid !== null && this.payload.isPaid !== '') {
        requestData.isPaid = this.payload.isPaid === 'true' || this.payload.isPaid === true;
      }

      const response = await this.eventService.newGetEvents(requestData);
      console.log('API Response:', response);
      this.events = {
        docs: response.data?.events || [],
        totalDocs: response.data?.total || 0,
        limit: response.data?.limit || this.payload.limit,
        page: response.data?.page || this.payload.page,
        totalPages: response.data?.totalPages || 1,
        hasPrevPage: response.data?.hasPrevPage || false,
        hasNextPage: response.data?.hasNextPage || false,
        prevPage: response.data?.prevPage || null,
        nextPage: response.data?.nextPage || null,
        pagingCounter: response.data?.pagingCounter || 1
      };
      console.log('Mapped Events:', this.events);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching events:', error);
      swalHelper.showToast('Failed to fetch events', 'error');
      this.events = {
        docs: [],
        totalDocs: 0,
        limit: this.payload.limit,
        page: this.payload.page,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
        pagingCounter: 1
      };
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onSearch(): void {
    this.payload.page = 1;
    this.payload.search = this.searchQuery;
    this.searchSubject.next(this.searchQuery);
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchEvents();
  }

  onEventTypeFilterChange(): void {
    this.payload.eventType = this.selectedEventType;
    this.payload.page = 1;
    this.fetchEvents();
  }

  onEventPriceFilterChange(): void {
    this.payload.isPaid = this.selectedEventPrice === '' ? undefined : this.selectedEventPrice;
    this.payload.page = 1;
    this.fetchEvents();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchEvents();
    }
  }

  openViewRegistrationsModal(event: any): void {
    this.router.navigate(['/event-registration-list'], {
      queryParams: {
        eventId: event._id,
        eventTitle: event.title || event.name || 'Event'
      }
    });
  }



  getRegistrationStatusToggleClass(status: string): string {
    if (!status || status === 'pending') {
      return 'btn-warning';
    }
    if (status === 'confirmed') {
      return 'btn-success';
    }
    return 'btn-secondary';
  }

  getRegistrationStatus(reg: any): string {
    return reg.registrationDetails?.status || 'pending';
  }

  openRegistrationDetailsModal(registration: any): void {
    this.selectedRegistrationDetails = registration;
    this.showRegistrationDetailsModal();
  }

  showRegistrationDetailsModal(): void {
    this.cdr.detectChanges();
    if (this.registrationDetailsModal) {
      this.registrationDetailsModal.show();
    } else {
      const modalElement = document.getElementById('registrationDetailsModal');
      if (modalElement) {
        this.registrationDetailsModal = new bootstrap.Modal(modalElement);
        this.registrationDetailsModal.show();
      }
    }
  }

  closeRegistrationDetailsModal(): void {
    if (this.registrationDetailsModal) {
      this.registrationDetailsModal.hide();
    }
    this.selectedRegistrationDetails = null;
  }

  openPaymentScreenshot(screenshotUrl: string): void {
    this.selectedPaymentScreenshot = screenshotUrl;
    this.showPaymentScreenshotModal();
  }

  showPaymentScreenshotModal(): void {
    this.cdr.detectChanges();
    if (this.paymentScreenshotModal) {
      this.paymentScreenshotModal.show();
    } else {
      const modalElement = document.getElementById('paymentScreenshotModal');
      if (modalElement) {
        this.paymentScreenshotModal = new bootstrap.Modal(modalElement);
        this.paymentScreenshotModal.show();
      }
    }
  }


  getUserName(userDetails: any | null): string {
    if (typeof userDetails === 'string') {
      return 'Unknown User';
    }
    return userDetails?.name || 'Unknown User';
  }

  getUserEmail(userDetails: any | null): string {
    if (typeof userDetails === 'string') {
      return 'N/A';
    }
    return userDetails?.email || 'N/A';
  }

  getPaymentDate(reg: any): string {
    if (reg.registrationDetails?.registeredAt) {
      const date = new Date(reg.registrationDetails.registeredAt);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return 'N/A';
  }

  getTransactionId(reg: any): string {
    // Check paymentDetails first, then fallback to old structure
    if (reg.paymentDetails?.transactionId) {
      return reg.paymentDetails.transactionId;
    }
    if (reg.paymentDetails?._id) {
      return reg.paymentDetails._id;
    }
    // Fallback to old structure for backward compatibility
    if (reg.data?.data?.transactionId) {
      return reg.data.data.transactionId;
    }
    if (reg.data?.transactionId) {
      return reg.data.transactionId;
    }
    if (reg.transactionId) {
      return reg.transactionId;
    }
    return 'N/A';
  }

  getScreenshotUrl(reg: any): string {
    // Check paymentDetails for screenshot URL
    if (reg.paymentDetails?.paymentScreenshotUrl) {
      return `${environment.imageUrl}${reg.paymentDetails.paymentScreenshotUrl}`;
    }
    // Fallback to old structure
    if (reg.paymentScreenshotUrl) {
      return `${environment.imageUrl}${reg.paymentScreenshotUrl}`;
    }
    return '';
  }

  getPaymentStatusClass(reg: any): string {
    const status = reg.registrationDetails?.paymentStatus || reg.paymentDetails?.status || 'pending';
    if (status === 'completed' || status === 'paid') return 'bg-success';
    if (status === 'pending') return 'bg-warning';
    if (status === 'failed' || status === 'refunded' || status === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  }

  getPaymentStatusText(reg: any): string {
    const status = reg.registrationDetails?.paymentStatus || reg.paymentDetails?.status || 'pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getRegistrationStatusText(status: string): string {
    if (!status || status === 'pending') return 'Pending';
    if (status === 'confirmed') return 'Confirmed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateForCard(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getUserImageUrl(reg: any): string {
    const userDetails = reg.userDetails;
    if (!userDetails || !userDetails.profilePic) {
      return '';
    }
    const imagePath = userDetails.profilePic.replace(/\\/g, '/');
    return imagePath.startsWith('http') ? imagePath : `${environment.imageUrl}${imagePath}`;
  }

  getUserNameForCard(reg: any): string {
    return this.getUserName(reg.userDetails) || 'Guest';
  }

  getEventTitle(reg: any): string {
    if (reg.eventDetails && typeof reg.eventDetails === 'object') {
      return reg.eventDetails.title || 'Event';
    }
    // Fallback to old structure
    if (reg.eventId && typeof reg.eventId === 'object') {
      return reg.eventId.title || 'Event';
    }
    return 'Event';
  }

  getEventStartDate(reg: any): string {
    if (reg.eventDetails && typeof reg.eventDetails === 'object') {
      return reg.eventDetails.startDate || '';
    }
    // Fallback to old structure
    if (reg.eventId && typeof reg.eventId === 'object') {
      return reg.eventId.startDate || '';
    }
    return '';
  }

  getEventEndDate(reg: any): string {
    if (reg.eventDetails && typeof reg.eventDetails === 'object') {
      return reg.eventDetails.endDate || '';
    }
    // Fallback to old structure
    if (reg.eventId && typeof reg.eventId === 'object') {
      return reg.eventId.endDate || '';
    }
    return '';
  }

  getCardId(reg: any): string {
    return reg._id || reg.userDetails?._id || 'N/A';
  }

  async downloadCard(registration: any): Promise<void> {
    try {
      // Prepare card data
      const cardData = {
        userName: this.getUserNameForCard(registration),
        userImage: this.getUserImageUrl(registration),
        eventTitle: this.getEventTitle(registration),
        eventStartDate: this.getEventStartDate(registration),
        eventEndDate: this.getEventEndDate(registration),
        cardId: this.getCardId(registration)
      };

      // Create card HTML element
      const cardElement = this.createCardElement(cardData);
      document.body.appendChild(cardElement);

      // Wait for image to load if exists
      if (cardData.userImage) {
        await this.waitForImageLoad(cardData.userImage);
      }

      // Generate canvas from card element
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: cardElement.offsetWidth,
        height: cardElement.offsetHeight
      });

      // Convert canvas to image and download
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `event-card-${cardData.userName.replace(/\s+/g, '-')}-${cardData.cardId.substring(0, 8)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Remove card element
      document.body.removeChild(cardElement);

      swalHelper.showToast('Event card downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating card:', error);
      swalHelper.showToast('Failed to generate event card', 'error');
    }
  }

  private createCardElement(cardData: any): HTMLElement {
    const cardDiv = document.createElement('div');
    cardDiv.id = 'printable-event-card';
    cardDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 3.375in;
      height: 2.125in;
      background: linear-gradient(135deg, #F57C00 0%, #FF9800 50%, #FFB74D 100%);
      border-radius: 16px;
      padding: 20px 24px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
    `;

    // Add decorative pattern overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
      pointer-events: none;
    `;
    cardDiv.appendChild(overlay);

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center;
      margin-bottom: 10px;
      position: relative;
      z-index: 1;
    `;
    const title = document.createElement('h2');
    title.textContent = 'Travel Nexus';
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    `;
    header.appendChild(title);
    cardDiv.appendChild(header);

    // Main content area
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex: 1;
      gap: 16px;
      position: relative;
      z-index: 1;
      margin-top: 4px;
    `;

    // Left side - Event details
    const eventDetails = document.createElement('div');
    eventDetails.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      min-width: 0;
    `;

    const eventTitle = document.createElement('div');
    eventTitle.textContent = cardData.eventTitle;
    eventTitle.style.cssText = `
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
      line-height: 1.25;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;

    const eventDate = document.createElement('div');
    const startDate = cardData.eventStartDate ? this.formatDateForCard(cardData.eventStartDate) : 'N/A';
    const endDate = cardData.eventEndDate ? this.formatDateForCard(cardData.eventEndDate) : '';
    eventDate.textContent = startDate === endDate ? startDate : `${startDate} - ${endDate}`;
    eventDate.style.cssText = `
      font-size: 12px;
      margin-bottom: 10px;
      opacity: 0.95;
      font-weight: 500;
    `;

    const divider = document.createElement('div');
    divider.style.cssText = `
      width: 100%;
      height: 1px;
      background: rgba(255, 255, 255, 0.3);
      margin: 6px 0 8px 0;
    `;

    const userName = document.createElement('div');
    userName.textContent = cardData.userName;
    userName.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin-top: 2px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      margin-bottom: 4px;
    `;

    const cardId = document.createElement('div');
    cardId.textContent = `ID: ${cardData.cardId}`;
    cardId.style.cssText = `
      font-size: 10px;
      opacity: 0.95;
      margin-top: 4px;
      font-weight: 500;
      letter-spacing: 0.3px;
      word-break: break-all;
      line-height: 1.3;
      background: rgba(0, 0, 0, 0.15);
      padding: 3px 6px;
      border-radius: 4px;
      display: inline-block;
      max-width: 100%;
    `;

    eventDetails.appendChild(eventTitle);
    eventDetails.appendChild(eventDate);
    eventDetails.appendChild(divider);
    eventDetails.appendChild(userName);
    eventDetails.appendChild(cardId);

    // Right side - User image
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid white;
      overflow: hidden;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      margin-top: -5px;
    `;

    if (cardData.userImage) {
      const userImg = document.createElement('img');
      userImg.src = cardData.userImage;
      userImg.alt = cardData.userName;
      userImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
      `;
      userImg.onerror = () => {
        // Fallback to initials if image fails to load
        imageContainer.innerHTML = `<div style="font-size: 42px; font-weight: 700; color: #F57C00; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);">${cardData.userName.charAt(0).toUpperCase()}</div>`;
      };
      imageContainer.appendChild(userImg);
    } else {
      // Show initials if no image
      const initialsDiv = document.createElement('div');
      initialsDiv.textContent = cardData.userName.charAt(0).toUpperCase();
      initialsDiv.style.cssText = `
        font-size: 42px;
        font-weight: 700;
        color: #F57C00;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
      `;
      imageContainer.appendChild(initialsDiv);
    }

    content.appendChild(eventDetails);
    content.appendChild(imageContainer);
    cardDiv.appendChild(content);

    return cardDiv;
  }

  private waitForImageLoad(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to continue
      img.src = imageUrl;
      // Timeout after 3 seconds
      setTimeout(() => resolve(), 3000);
    });
  }
}