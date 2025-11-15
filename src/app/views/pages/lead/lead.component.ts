import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TravelLeadService, TravelLead, TravelLeadResponse, TravelLeadDetailResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';
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
}

