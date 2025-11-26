import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TravelLeadService, TravelLead, TravelLeadResponse, TravelLeadDetailResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';
import Swal from 'sweetalert2';
declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-travel-lead-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  providers: [TravelLeadService],
  templateUrl: './lead.component.html',
  styleUrls: ['./lead.component.css']
})
export class LeadManagementComponent implements OnInit, AfterViewInit {
  leads: TravelLeadResponse = {
    docs: [],
    totalDocs: 0,
    limit: 50,
    page: 1,
    totalPages: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };

  loading: boolean = false;
  detailLoading: boolean = false;
  searchQuery: string = '';
  selectedLead: TravelLead | null = null;
  leadDetailModal: any;
  imageurl = environment.imageUrl;
  
  private searchSubject = new Subject<string>();
  
  payload = {
    page: 1,
    limit: 50,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  };

  Math = Math;

  constructor(
    private travelLeadService: TravelLeadService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchLeads();
    });
  }

  ngOnInit(): void {
    this.fetchLeads();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('leadDetailModal');
      if (modalElement) {
        this.leadDetailModal = new bootstrap.Modal(modalElement);
      }
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchLeads(): Promise<void> {
    this.loading = true;
    try {
      const requestData: any = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        sortBy: this.payload.sortBy,
        sortOrder: this.payload.sortOrder
      };

      const response = await this.travelLeadService.getAllLeads(requestData);
      this.leads = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching leads:', error);
      swalHelper.showToast('Failed to fetch leads', 'error');
      this.leads = {
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

  onLimitChange(): void {
    this.payload.page = 1;
    this.fetchLeads();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchLeads();
    }
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.payload.search = '';
    this.payload.page = 1;
    this.fetchLeads();
  }

  async openLeadDetail(lead: TravelLead): Promise<void> {
    this.detailLoading = true;
    try {
      const response = await this.travelLeadService.getLeadDetail(lead._id);
      if (response && response.success && response.data && response.data.lead) {
        this.selectedLead = response.data.lead;
        this.showDetailModal();
      } else {
        swalHelper.showToast('Failed to fetch lead details', 'error');
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      swalHelper.showToast('Failed to fetch lead details', 'error');
    } finally {
      this.detailLoading = false;
    }
  }

  showDetailModal(): void {
    this.cdr.detectChanges();
    if (this.leadDetailModal) {
      this.leadDetailModal.show();
    } else {
      $('#leadDetailModal').modal('show');
    }
  }

  closeDetailModal(): void {
    if (this.leadDetailModal) {
      this.leadDetailModal.hide();
    } else {
      $('#leadDetailModal').modal('hide');
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number | undefined | null): string {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'active':
        return 'bg-success';
      case 'assigned':
        return 'bg-info';
      case 'in_progress':
        return 'bg-primary';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    if (!status) return 'N/A';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    const baseUrl = this.imageurl;
    return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-image.png';
  }

  getUserDisplayName(user: any): string {
    if (!user) return 'N/A';
    return user.name || user.business_name || user.email || 'Unknown User';
  }

  getAssignmentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getAcceptedCount(assignedTo: any[]): number {
    if (!assignedTo || assignedTo.length === 0) return 0;
    return assignedTo.filter(a => a.status === 'accepted').length;
  }

  hasCountries(lead: TravelLead | null): boolean {
    return !!(lead && lead.region && lead.region.countries && lead.region.countries.length > 0);
  }

  getCountries(lead: TravelLead | null): string[] {
    if (!lead || !lead.region || !lead.region.countries) return [];
    return lead.region.countries;
  }

  getAdminApprovalStatus(lead: TravelLead): string {
    if (!lead.adminApproval) return 'pending';
    return lead.adminApproval.status || 'pending';
  }

  getAdminApprovalStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getAdminApprovalStatusLabel(status: string): string {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  isApproved(lead: TravelLead): boolean {
    return lead.adminApproval?.status === 'approved';
  }

  isRejected(lead: TravelLead): boolean {
    return lead.adminApproval?.status === 'rejected';
  }

  canApprove(lead: TravelLead): boolean {
    return !lead.adminApproval || lead.adminApproval.status === 'pending';
  }

  canReject(lead: TravelLead): boolean {
    return !lead.adminApproval || lead.adminApproval.status === 'pending';
  }

  async approveLead(lead: TravelLead): Promise<void> {
    const result = await swalHelper.confirmation(
      'Approve Lead',
      `Are you sure you want to approve this lead for ${lead.customerName}?`,
      'question'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await this.travelLeadService.approveLead(lead._id);
      console.log('Approve lead response:', response); // Debug log
      
      // Check for success - handle both status === 1 and success === true
      const isSuccess = (response && (response.status === 1 || response.success === true || (response.data && response.data.status === 1)));
      
      if (isSuccess) {
        swalHelper.showToast('Lead approved successfully', 'success');
        // Refresh the leads list
        await this.fetchLeads();
        this.cdr.detectChanges();
        // If modal is open, refresh the selected lead
        if (this.selectedLead && this.selectedLead._id === lead._id) {
          await this.openLeadDetail(lead);
          this.cdr.detectChanges();
        }
      } else {
        const errorMessage = response?.message || response?.data?.message || 'Failed to approve lead';
        console.error('Approve lead failed:', response);
        swalHelper.showToast(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Error approving lead:', error);
      // Check if error has response data (might be a successful response wrapped in error)
      if (error?.error && (error.error.status === 1 || error.error.success === true)) {
        swalHelper.showToast('Lead approved successfully', 'success');
        await this.fetchLeads();
        this.cdr.detectChanges();
        if (this.selectedLead && this.selectedLead._id === lead._id) {
          await this.openLeadDetail(lead);
          this.cdr.detectChanges();
        }
      } else {
        const errorMessage = error?.error?.message || error?.message || 'Failed to approve lead';
        swalHelper.showToast(errorMessage, 'error');
      }
    }
  }

  async rejectLead(lead: TravelLead): Promise<void> {
    const { value: rejectionReason } = await Swal.fire({
      title: 'Reject Lead',
      text: 'Please provide a reason for rejecting this lead (optional):',
      input: 'textarea',
      inputPlaceholder: 'Enter rejection reason...',
      inputAttributes: {
        'aria-label': 'Rejection reason'
      },
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      inputValidator: (value: string) => {
        // Optional field, so no validation needed
        return null;
      }
    });

    if (rejectionReason === undefined) {
      return; // User cancelled
    }

    const result = await swalHelper.confirmation(
      'Reject Lead',
      `Are you sure you want to reject this lead for ${lead.customerName}?`,
      'warning'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await this.travelLeadService.rejectLead(lead._id, rejectionReason || undefined);
      if (response && response.status === 1) {
        swalHelper.showToast('Lead rejected successfully', 'success');
        // Refresh the leads list
        await this.fetchLeads();
        // If modal is open, refresh the selected lead
        if (this.selectedLead && this.selectedLead._id === lead._id) {
          await this.openLeadDetail(lead);
        }
      } else {
        swalHelper.showToast(response?.message || 'Failed to reject lead', 'error');
      }
    } catch (error) {
      console.error('Error rejecting lead:', error);
      swalHelper.showToast('Failed to reject lead', 'error');
    }
  }
}

