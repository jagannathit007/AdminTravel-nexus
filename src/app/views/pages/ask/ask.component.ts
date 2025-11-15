import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { TravelAskService, TravelAsk, TravelAskResponse, TravelAskDetailResponse, RegionService, Region } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';
declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-travel-ask-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [TravelAskService, RegionService],
  templateUrl: './ask.component.html',
  styleUrls: ['./ask.component.css']
})
export class AskManagementComponent implements OnInit, AfterViewInit {
  asks: TravelAskResponse = {
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
  detailLoading: boolean = false;
  searchQuery: string = '';
  selectedAsk: TravelAsk | null = null;
  askDetailModal: any;
  imageurl = environment.imageUrl;
  
  // Filter options
  regions: Region[] = [];
  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' }
  ];
  
  publicVisibilityOptions = [
    { label: 'All', value: undefined },
    { label: 'Public', value: true },
    { label: 'Regional', value: false }
  ];

  private searchSubject = new Subject<string>();
  
  payload = {
    page: 1,
    limit: 10,
    search: '',
    region: '',
    status: '',
    isPublic: undefined as boolean | undefined,
    dateFrom: '',
    dateTo: '',
    minBudget: undefined as number | undefined,
    maxBudget: undefined as number | undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  };

  Math = Math;

  constructor(
    private travelAskService: TravelAskService,
    private regionService: RegionService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchAsks();
    });
  }

  ngOnInit(): void {
    this.fetchRegions();
    this.fetchAsks();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('askDetailModal');
      if (modalElement) {
        this.askDetailModal = new bootstrap.Modal(modalElement);
      }
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchRegions(): Promise<void> {
    try {
      const response = await this.regionService.getRegions({
        page: 1,
        limit: 1000,
        search: ''
      });
      this.regions = response.docs || [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  }

  async fetchAsks(): Promise<void> {
    this.loading = true;
    try {
      const requestData: any = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        sortBy: this.payload.sortBy,
        sortOrder: this.payload.sortOrder
      };

      if (this.payload.region) {
        requestData.region = this.payload.region;
      }

      if (this.payload.status) {
        requestData.status = this.payload.status;
      }

      if (this.payload.isPublic !== undefined) {
        requestData.isPublic = this.payload.isPublic;
      }

      if (this.payload.dateFrom) {
        requestData.dateFrom = this.payload.dateFrom;
      }

      if (this.payload.dateTo) {
        requestData.dateTo = this.payload.dateTo;
      }

      if (this.payload.minBudget !== undefined) {
        requestData.minBudget = this.payload.minBudget;
      }

      if (this.payload.maxBudget !== undefined) {
        requestData.maxBudget = this.payload.maxBudget;
      }

      const response = await this.travelAskService.getAllAsks(requestData);
      this.asks = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching asks:', error);
      swalHelper.showToast('Failed to fetch asks', 'error');
      this.asks = {
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

  onFilterChange(): void {
    this.payload.page = 1;
    this.fetchAsks();
  }

  onLimitChange(): void {
    this.payload.page = 1;
    this.fetchAsks();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchAsks();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.payload = {
      page: 1,
      limit: 10,
      search: '',
      region: '',
      status: '',
      isPublic: undefined,
      dateFrom: '',
      dateTo: '',
      minBudget: undefined,
      maxBudget: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    this.fetchAsks();
  }

  async openAskDetail(ask: TravelAsk): Promise<void> {
    this.detailLoading = true;
    try {
      const response = await this.travelAskService.getAskDetail(ask._id);
      if (response && response.success && response.data && response.data.ask) {
        this.selectedAsk = response.data.ask;
        this.showDetailModal();
      } else {
        swalHelper.showToast('Failed to fetch ask details', 'error');
      }
    } catch (error) {
      console.error('Error fetching ask details:', error);
      swalHelper.showToast('Failed to fetch ask details', 'error');
    } finally {
      this.detailLoading = false;
    }
  }

  showDetailModal(): void {
    this.cdr.detectChanges();
    if (this.askDetailModal) {
      this.askDetailModal.show();
    } else {
      $('#askDetailModal').modal('show');
    }
  }

  closeDetailModal(): void {
    if (this.askDetailModal) {
      this.askDetailModal.hide();
    } else {
      $('#askDetailModal').modal('hide');
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
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-secondary';
      case 'completed':
        return 'bg-info';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A';
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

  calculateDuration(startDate: string | undefined, endDate: string | undefined): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTotalPax(paxCount: any): number {
    if (!paxCount) return 0;
    return (paxCount.adults || 0) + (paxCount.children || 0) + (paxCount.infants || 0);
  }

  hasCountries(ask: TravelAsk | null): boolean {
    return !!(ask && ask.region && ask.region.countries && ask.region.countries.length > 0);
  }

  getCountries(ask: TravelAsk | null): string[] {
    if (!ask || !ask.region || !ask.region.countries) return [];
    return ask.region.countries;
  }
}
