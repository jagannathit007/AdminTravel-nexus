import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/env/env.local';
import { EventService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import html2canvas from 'html2canvas';

declare var bootstrap: any;

@Component({
  selector: 'app-event-registration-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [EventService],
  templateUrl: './event-registration-list.component.html',
  styleUrls: ['./event-registration-list.component.css'],
})
export class EventRegistrationListComponent implements OnInit, AfterViewInit {
  eventId: string = '';
  eventTitle: string = '';
  registrations: any = null;
  registrationsLoading: boolean = false;
  registrationsPage: number = 1;
  registrationsLimit: number = 10;
  searchQuery: string = '';
  selectedStatus: string = '';
  selectedPaymentStatus: string = '';
  
  paymentScreenshotModal: any;
  selectedPaymentScreenshot: string | null = null;
  registrationDetailsModal: any;
  selectedRegistrationDetails: any | null = null;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    //{ value: 'refunded', label: 'Refunded' }
  ];

  private searchSubject = new Subject<string>();

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchRegistrations();
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.eventId = params['eventId'] || '';
      this.eventTitle = params['eventTitle'] || 'Event';
      if (this.eventId) {
        this.registrationsPage = 1;
        this.fetchRegistrations();
      }
    });
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

  async fetchRegistrations(): Promise<void> {
    if (!this.eventId) return;

    this.registrationsLoading = true;
    try {
      const response = await this.eventService.getRegistrationsByEventId(
        this.eventId,
        this.registrationsPage,
        this.registrationsLimit,
        this.selectedStatus || undefined,
        this.selectedPaymentStatus || undefined,
        this.searchQuery
      );
      this.registrations = response;
      
      // Ensure registrationStatus is set for each registration (only pending or confirmed)
      if (this.registrations?.data?.registrations) {
        this.registrations.data.registrations.forEach((reg: any) => {
          if (!reg.registrationDetails) {
            reg.registrationDetails = {};
          }
          if (!reg.registrationDetails.status) {
            reg.registrationDetails.status = 'pending';
          }
          // Normalize to only pending or confirmed (remove cancelled)
          if (reg.registrationDetails.status === 'cancelled') {
            reg.registrationDetails.status = 'pending';
          }
        });
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching registrations:', error);
      swalHelper.showToast('Failed to fetch registrations', 'error');
    } finally {
      this.registrationsLoading = false;
    }
  }

  onSearch(): void {
    this.registrationsPage = 1;
    this.searchSubject.next(this.searchQuery);
  }

  onStatusChange(): void {
    this.registrationsPage = 1;
    this.fetchRegistrations();
  }

  onPaymentStatusChange(): void {
    this.registrationsPage = 1;
    this.fetchRegistrations();
  }

  onChange(): void {
    this.registrationsPage = 1;
    this.fetchRegistrations();
  }

  changeRegistrationsPage(page: number): void {
    if (page >= 1 && page <= (this.registrations?.data.totalPages || 1)) {
      this.registrationsPage = page;
      this.fetchRegistrations();
    }
  }

  goBack(): void {
    this.router.navigate(['/payment']);
  }

  async toggleRegistrationStatus(registration: any): Promise<void> {
    console.log('Toggling registration status for:', registration);
    const currentStatus = registration.registrationDetails?.status || 'pending';
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';

    const result = await swalHelper.confirmation(
      'Update Registration Status',
      `Change registration status from "${currentStatus}" to "${newStatus}"?`,
      'warning'
    );

    if (result.isConfirmed) {
      this.registrationsLoading = true;
      try {
        const response = await this.eventService.updateRegistrationStatus(
          registration.registrationDetails._id, 
          newStatus
        );
        
        if (response.success) {
          swalHelper.showToast('Registration status updated successfully', 'success');
          if (!registration.registrationDetails) {
            registration.registrationDetails = {};
          }
          registration.registrationDetails.status = newStatus;
          this.cdr.detectChanges();
        } else {
          swalHelper.showToast(response.message || 'Failed to update registration status', 'error');
        }
      } catch (error: any) {
        console.error('Error updating registration status:', error);
        swalHelper.showToast(error?.response?.data?.message || 'Failed to update registration status', 'error');
      } finally {
        this.registrationsLoading = false;
      }
    }
  }

  async togglePaymentStatus(registration: any): Promise<void> {
    console.log('Toggling payment status for:', registration);
    
    if (!registration.paymentDetails?._id) {
      swalHelper.showToast('Payment details not found for this registration', 'error');
      return;
    }

    const currentStatus = registration.registrationDetails?.paymentStatus || registration.paymentDetails?.status || 'pending';
    
    // Determine next status based on current status
    let newStatus: string;
    if (currentStatus === 'pending') {
      newStatus = 'completed';
    } else if (currentStatus === 'completed' || currentStatus === 'paid') {
      newStatus = 'pending';
    } else {
      // For failed/refunded, allow changing to completed
      newStatus = 'completed';
    }

    const result = await swalHelper.confirmation(
      'Update Payment Status',
      `Change payment status from "${currentStatus}" to "${newStatus}"?`,
      'warning'
    );

    if (result.isConfirmed) {
      this.registrationsLoading = true;
      try {
        const response = await this.eventService.updatePaymentStatus(
          registration.paymentDetails._id,
          newStatus
        );
        
        if (response.success) {
          swalHelper.showToast('Payment status updated successfully', 'success');
          
          // Update local registration object
          if (!registration.registrationDetails) {
            registration.registrationDetails = {};
          }
          registration.registrationDetails.paymentStatus = newStatus;
          
          // Also update paymentDetails if it exists
          if (registration.paymentDetails) {
            registration.paymentDetails.status = newStatus;
          }
          
          // Refresh the list to get updated data
          await this.fetchRegistrations();
        } else {
          swalHelper.showToast(response.message || 'Failed to update payment status', 'error');
        }
      } catch (error: any) {
        console.error('Error updating payment status:', error);
        swalHelper.showToast(error?.response?.data?.message || 'Failed to update payment status', 'error');
      } finally {
        this.registrationsLoading = false;
      }
    }
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

  getPaymentStatusToggleClass(reg: any): string {
    const status = reg.registrationDetails?.paymentStatus || reg.paymentDetails?.status || 'pending';
    if (status === 'completed' || status === 'paid') return 'btn-success';
    if (status === 'pending') return 'btn-warning';
    if (status === 'failed' || status === 'refunded' || status === 'cancelled') return 'btn-danger';
    return 'btn-secondary';
  }

  getPaymentStatus(reg: any): string {
    return reg.registrationDetails?.paymentStatus || reg.paymentDetails?.status || 'pending';
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
    return this.buildImageUrl(userDetails.profilePic);
  }

  private buildImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return '';
    }
    
    // If already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Normalize path separators (Windows backslashes to forward slashes)
    let normalizedPath = imagePath.replace(/\\/g, '/');
    
    // Remove leading slash if present (to avoid double slashes)
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }
    
    // Ensure environment.imageUrl has trailing slash
    const baseUrl = environment.imageUrl.endsWith('/') 
      ? environment.imageUrl 
      : `${environment.imageUrl}/`;
    
    const fullUrl = `${baseUrl}${normalizedPath}`;
    console.log('Built image URL:', fullUrl);
    return fullUrl;
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
    return this.eventTitle || 'Event';
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
      // Get sponsors from event details
      const sponsors = registration.eventDetails?.sponsors || [];
      const sponsorLogos: string[] = [];
      
      // Extract sponsor logo URLs
      for (const sponsor of sponsors) {
        if (sponsor.logo) {
          const logoUrl = this.buildImageUrl(sponsor.logo);
          if (logoUrl) {
            sponsorLogos.push(logoUrl);
          }
        }
      }

      // Prepare card data
      const cardData = {
        userName: this.getUserNameForCard(registration),
        userImage: this.getUserImageUrl(registration),
        eventTitle: this.getEventTitle(registration),
        eventStartDate: this.getEventStartDate(registration),
        eventEndDate: this.getEventEndDate(registration),
        eventLocation: registration.eventDetails?.location || '',
        eventVenue: registration.eventDetails?.venue || '',
        cardId: this.getCardId(registration),
        sponsorLogos: sponsorLogos,
        travelNexusLogo: '/assets/images/download.png'
      };

      // Create card HTML element
      const cardElement = this.createCardElement(cardData);
      document.body.appendChild(cardElement);

      // Wait for all images to load
      const imagePromises: Promise<void>[] = [];
      if (cardData.userImage) {
        imagePromises.push(this.waitForImageLoad(cardData.userImage));
      }
      if (cardData.travelNexusLogo) {
        imagePromises.push(this.waitForImageLoad(cardData.travelNexusLogo));
      }
      cardData.sponsorLogos.forEach(logo => {
        imagePromises.push(this.waitForImageLoad(logo));
      });
      await Promise.all(imagePromises);

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
    
    // Professional event card dimensions - Portrait orientation (height > width)
    cardDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 2.5in;
      height: 4in;
      background: linear-gradient(135deg, #F57C00 0%, #FF9800 50%, #FFB74D 100%);
      border-radius: 12px;
      padding: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
      font-family: 'Segoe UI', 'Arial', sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      border: 3px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
    `;

    // Add subtle grid pattern overlay
    const gridOverlay = document.createElement('div');
    gridOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
      z-index: 0;
    `;
    cardDiv.appendChild(gridOverlay);

    // Top section with lanyard hole and Travel Nexus logo
    const topSection = document.createElement('div');
    topSection.style.cssText = `
      position: relative;
      z-index: 1;
      padding: 10px 16px 8px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    `;
    
    // Lanyard hole
    const lanyardHole = document.createElement('div');
    lanyardHole.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #e0e0e0;
      border: 3px solid #9e9e9e;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    topSection.appendChild(lanyardHole);
    
    // Travel Nexus Logo
    if (cardData.travelNexusLogo) {
      const logoContainer = document.createElement('div');
      logoContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.95);
        padding: 6px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      `;
      const logoImg = document.createElement('img');
      logoImg.src = cardData.travelNexusLogo;
      logoImg.alt = 'Travel Nexus';
      logoImg.style.cssText = `
        max-height: 32px;
        max-width: 120px;
        object-fit: contain;
      `;
      logoImg.onerror = () => {
        logoContainer.style.display = 'none';
      };
      logoContainer.appendChild(logoImg);
      topSection.appendChild(logoContainer);
    }
    
    cardDiv.appendChild(topSection);

    // Main content area - Portrait layout
    const mainContent = document.createElement('div');
    mainContent.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      gap: 12px;
      position: relative;
      z-index: 1;
      align-items: center;
    `;

    // User Image - Centered at top
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 120px;
      height: 120px;
      border-radius: 8px;
      border: 4px solid white;
      overflow: hidden;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
      margin-bottom: 8px;
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
        imageContainer.innerHTML = `<div style="font-size: 48px; font-weight: 700; color: #F57C00; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);">${cardData.userName.charAt(0).toUpperCase()}</div>`;
      };
      imageContainer.appendChild(userImg);
    } else {
      // Show initials if no image
      const initialsDiv = document.createElement('div');
      initialsDiv.textContent = cardData.userName.charAt(0).toUpperCase();
      initialsDiv.style.cssText = `
        font-size: 48px;
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
    mainContent.appendChild(imageContainer);

    // Event title with background
    const eventTitleBg = document.createElement('div');
    eventTitleBg.style.cssText = `
      background: rgba(0, 0, 0, 0.6);
      padding: 8px 12px;
      margin-bottom: 6px;
      border-radius: 4px;
      width: 100%;
      text-align: center;
    `;
    const eventTitle = document.createElement('div');
    eventTitle.textContent = cardData.eventTitle.toUpperCase();
    eventTitle.style.cssText = `
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
      line-height: 1.2;
      word-wrap: break-word;
    `;
    eventTitleBg.appendChild(eventTitle);
    mainContent.appendChild(eventTitleBg);

    // Event date
    const eventDate = document.createElement('div');
    const startDate = cardData.eventStartDate ? this.formatDateForCard(cardData.eventStartDate) : '';
    const endDate = cardData.eventEndDate ? this.formatDateForCard(cardData.eventEndDate) : '';
    const dateText = startDate && endDate && startDate !== endDate 
      ? `${startDate} - ${endDate}` 
      : startDate || 'TBA';
    eventDate.textContent = dateText;
    eventDate.style.cssText = `
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      opacity: 0.95;
      letter-spacing: 0.3px;
      text-align: center;
    `;
    mainContent.appendChild(eventDate);

    // Location/Venue if available
    if (cardData.eventLocation || cardData.eventVenue) {
      const location = document.createElement('div');
      location.textContent = cardData.eventVenue || cardData.eventLocation || '';
      location.style.cssText = `
        font-size: 10px;
        font-weight: 500;
        margin-bottom: 12px;
        opacity: 0.9;
        text-align: center;
      `;
      mainContent.appendChild(location);
    }

    // User name section
    const userNameBg = document.createElement('div');
    userNameBg.style.cssText = `
      background: rgba(255, 255, 255, 0.15);
      padding: 10px 12px;
      border-radius: 4px;
      width: 100%;
      text-align: center;
      margin-top: auto;
    `;
    const userName = document.createElement('div');
    userName.textContent = cardData.userName.toUpperCase();
    userName.style.cssText = `
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
    `;
    userNameBg.appendChild(userName);
    mainContent.appendChild(userNameBg);
    
    cardDiv.appendChild(mainContent);

    // Bottom section - Sponsor logos
    if (cardData.sponsorLogos && cardData.sponsorLogos.length > 0) {
      const sponsorSection = document.createElement('div');
      sponsorSection.style.cssText = `
        background: rgba(0, 0, 0, 0.4);
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        position: relative;
        z-index: 1;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      `;

      const poweredBy = document.createElement('div');
      poweredBy.textContent = 'Powered by';
      poweredBy.style.cssText = `
        font-size: 9px;
        font-weight: 600;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      sponsorSection.appendChild(poweredBy);

      const logosContainer = document.createElement('div');
      logosContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      `;

      cardData.sponsorLogos.forEach((logoUrl: string) => {
        const sponsorLogo = document.createElement('img');
        sponsorLogo.src = logoUrl;
        sponsorLogo.alt = 'Sponsor';
        sponsorLogo.style.cssText = `
          max-height: 24px;
          max-width: 60px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.9;
        `;
        sponsorLogo.onerror = () => {
          sponsorLogo.style.display = 'none';
        };
        logosContainer.appendChild(sponsorLogo);
      });

      sponsorSection.appendChild(logosContainer);
      cardDiv.appendChild(sponsorSection);
    }

    return cardDiv;
  }

  private waitForImageLoad(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!imageUrl) {
        resolve();
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to continue
      img.src = imageUrl;
      // Timeout after 5 seconds
      setTimeout(() => resolve(), 5000);
    });
  }
}

