import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/env/env.local';
import { BannerRequestService, BannerRequest, BannerRequestResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
declare var bootstrap: any;
declare var $: any;

type BannerStatus = 'pending' | 'approved' | 'rejected' | 'live' | 'expired';

// Define locally if not available in service
interface PaymentDetails {
  _id: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  transactionId: string;
  upiTransactionId: string;
  paymentScreenshotUrl: string;
  isApproved: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-banner-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [BannerRequestService],
  templateUrl: './bannerRequest.component.html',
  styleUrls: ['./bannerRequest.component.css'],
})
export class BannerRequestsComponent implements OnInit, AfterViewInit {
  bannerRequests: BannerRequestResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };
  
  loading: boolean = false;
  searchQuery: string = '';
  selectedBannerForPreview: BannerRequest | null = null;
  selectedPaymentScreenshot: string | null = null;
  bannerPreviewModal: any;
  paymentScreenshotModal: any;
  statusUpdateModal: any;
  selectedBannerForStatusUpdate: BannerRequest | null = null;
  newStatus: BannerStatus = 'pending';
  imageurl = environment.imageUrl;
  
  statusOptions: { value: BannerStatus; label: string; class: string; }[] = [
    { value: 'pending', label: 'Pending', class: 'bg-warning' },
    { value: 'approved', label: 'Approved', class: 'bg-success' },
    { value: 'rejected', label: 'Rejected', class: 'bg-danger' },
    { value: 'live', label: 'Live', class: 'bg-info' },
    { value: 'expired', label: 'Expired', class: 'bg-secondary' }
  ];
  
  private searchSubject = new Subject<string>();
  
  payload = {
    search: '',
    page: 1,
    limit: 10
  };

  constructor(
    private bannerRequestService: BannerRequestService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.fetchBannerRequests();
    });
  }

  ngOnInit(): void {
    this.fetchBannerRequests();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const bannerPreviewModalElement = document.getElementById('bannerPreviewModal');
      if (bannerPreviewModalElement) {
        this.bannerPreviewModal = new bootstrap.Modal(bannerPreviewModalElement);
      }
      
      const paymentScreenshotModalElement = document.getElementById('paymentScreenshotModal');
      if (paymentScreenshotModalElement) {
        this.paymentScreenshotModal = new bootstrap.Modal(paymentScreenshotModalElement);
      }

      const statusUpdateModalElement = document.getElementById('statusUpdateModal');
      if (statusUpdateModalElement) {
        this.statusUpdateModal = new bootstrap.Modal(statusUpdateModalElement);
      }
      
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchBannerRequests(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search
      };
      const response = await this.bannerRequestService.getAllBannerRequests(requestData);
      this.bannerRequests = response.data?.requests || response;
      
      // Validate and normalize response
      if (!this.bannerRequests.docs || !Array.isArray(this.bannerRequests.docs)) {
        this.bannerRequests.docs = [];
      }
      if (!this.bannerRequests.totalDocs || isNaN(this.bannerRequests.totalDocs)) {
        this.bannerRequests.totalDocs = 0;
      }
      if (!this.bannerRequests.totalPages || isNaN(this.bannerRequests.totalPages)) {
        this.bannerRequests.totalPages = 1;
      }
      if (!this.bannerRequests.page || isNaN(this.bannerRequests.page)) {
        this.bannerRequests.page = 1;
      }
      
      this.payload.page = this.bannerRequests.page;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching banner requests:', error);
      swalHelper.showToast('Failed to fetch banner requests', 'error');
      this.bannerRequests = {
        docs: [],
        totalDocs: 0,
        limit: this.payload.limit,
        page: this.payload.page,
        totalPages: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      };
      this.payload.page = 1;
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
    }
  }

  onSearch(): void {
    this.payload.page = 1;
    this.payload.search = this.searchQuery;
    this.searchSubject.next(this.searchQuery);
  }
  
  onChange(): void {
    this.payload.page = 1;
    this.fetchBannerRequests();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchBannerRequests();
    }
  }

  openBannerPreview(bannerRequest: BannerRequest): void {
    this.selectedBannerForPreview = bannerRequest;
    this.showBannerPreviewModal();
  }

  openPaymentScreenshot(paymentScreenshotUrl: string): void {
    this.selectedPaymentScreenshot = paymentScreenshotUrl;
    this.showPaymentScreenshotModal();
  }

  openStatusUpdateModal(bannerRequest: BannerRequest): void {
    this.selectedBannerForStatusUpdate = bannerRequest;
    this.newStatus = bannerRequest.status as BannerStatus;
    this.showStatusUpdateModal();
  }

  showBannerPreviewModal(): void {
    this.cdr.detectChanges();
    if (this.bannerPreviewModal) {
      this.bannerPreviewModal.show();
    } else {
      $('#bannerPreviewModal').modal('show');
    }
  }

  showPaymentScreenshotModal(): void {
    this.cdr.detectChanges();
    if (this.paymentScreenshotModal) {
      this.paymentScreenshotModal.show();
    } else {
      $('#paymentScreenshotModal').modal('show');
    }
  }

  showStatusUpdateModal(): void {
    this.cdr.detectChanges();
    if (this.statusUpdateModal) {
      this.statusUpdateModal.show();
    } else {
      $('#statusUpdateModal').modal('show');
    }
  }

  async updateBannerStatus(): Promise<void> {
    if (!this.selectedBannerForStatusUpdate || !this.newStatus) {
      swalHelper.showToast('Please select a valid status', 'warning');
      return;
    }

    // Validate that newStatus is a valid enum value
    const validStatuses: BannerStatus[] = ['pending', 'approved', 'rejected', 'live', 'expired'];
    if (!validStatuses.includes(this.newStatus)) {
      swalHelper.showToast('Invalid status selected', 'error');
      return;
    }

    try {
      this.loading = true;
      
      const response = await this.bannerRequestService.updateBannerRequestStatus(
        this.selectedBannerForStatusUpdate._id, 
        this.newStatus
      );
      
      if (response && response.success) {
        // Update the local data
        const bannerIndex = this.bannerRequests.docs.findIndex(
          banner => banner._id === this.selectedBannerForStatusUpdate!._id
        );
        if (bannerIndex !== -1) {
          this.bannerRequests.docs[bannerIndex].status = this.newStatus;
        }
        
        swalHelper.showToast('Banner request status updated successfully', 'success');
        this.closeStatusUpdateModal();
      } else {
        swalHelper.showToast(response?.message || 'Failed to update banner status', 'error');
      }
    } catch (error: any) {
      console.error('Error updating banner status:', error);
      swalHelper.showToast(error?.response?.data?.message || 'Failed to update banner status', 'error');
    } finally {
      this.loading = false;
    }
  }

  closeStatusUpdateModal(): void {
    if (this.statusUpdateModal) {
      this.statusUpdateModal.hide();
    } else {
      $('#statusUpdateModal').modal('hide');
    }
  }

  getStatusClass(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.class : 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    const baseUrl = this.imageurl;
    return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
  }

  getUserDisplayName(user: any): string {
    if (!user) return 'N/A';
    return user.name || user.business_name || user.email || 'Unknown User';
  }

  getPaymentStatusClass(payment: any): string {
    if (!payment) return 'bg-secondary';
    if (payment.status === 'completed' && payment.isApproved) return 'bg-success';
    if (payment.status === 'completed' && !payment.isApproved) return 'bg-warning';
    if (payment.status === 'failed') return 'bg-danger';
    return 'bg-info';
  }

  getPaymentStatusText(payment: any): string {
    if (!payment) return 'No Payment';
    if (payment.status === 'completed' && payment.isApproved) return 'Approved';
    if (payment.status === 'completed' && !payment.isApproved) return 'Pending Approval';
    if (payment.status === 'failed') return 'Failed';
    return payment.status || 'Unknown';
  }

  formatCurrency(amount: number, currency: string = 'INR'): string {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency === 'INR' ? 'INR' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  calculateDuration(fromDate: string, toDate: string): number {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper methods for safe payment data access
  getPaymentData(banner: BannerRequest): PaymentDetails | null {
    return banner.paymentDetails || banner.paymentId || null;
  }

  hasPaymentScreenshot(banner: BannerRequest): boolean {
    const payment = this.getPaymentData(banner);
    return !!(payment?.paymentScreenshotUrl);
  }

  getPaymentScreenshotUrl(banner: BannerRequest): string {
    const payment = this.getPaymentData(banner);
    return payment?.paymentScreenshotUrl || '';
  }

  getTransactionId(payment: PaymentDetails | null): string {
    return payment?.transactionId || '';
  }

  getUpiTransactionId(payment: PaymentDetails | null): string {
    return payment?.upiTransactionId || '';
  }
}