import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerRateService, BannerRate, BannerRateResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-banner-rates',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [BannerRateService],
  templateUrl: './bannerRates.component.html',
  styleUrls: ['./bannerRates.component.css'],
})
export class BannerRatesComponent implements OnInit, AfterViewInit {
  bannerRates: BannerRateResponse = {
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
  selectedRate: BannerRate | null = null;
  rateModal: any;
  editMode: boolean = false;
  formSubmitted: boolean = false;
  
  newRate = {
    days: null as number | null,
    cost: null as number | null,
    isActive: true
  };
  
  private searchSubject = new Subject<string>();
  
  payload = {
    search: '',
    page: 1,
    limit: 10
  };

  constructor(
    private bannerRateService: BannerRateService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.fetchBannerRates();
    });
  }

  ngOnInit(): void {
    this.fetchBannerRates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('rateModal');
      if (modalElement) {
        this.rateModal = new bootstrap.Modal(modalElement);
      }
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchBannerRates(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search
      };
      const response = await this.bannerRateService.getAllBannerRates(requestData);
      
      // Handle the response structure based on your API
      if (response.data && response.data.rates) {
        this.bannerRates = {
          docs: response.data.rates,
          totalDocs: response.data.total || response.data.rates.length,
          limit: this.payload.limit,
          page: this.payload.page,
          totalPages: Math.ceil((response.data.total || response.data.rates.length) / this.payload.limit),
          pagingCounter: 1,
          hasPrevPage: this.payload.page > 1,
          hasNextPage: this.payload.page < Math.ceil((response.data.total || response.data.rates.length) / this.payload.limit),
          prevPage: this.payload.page > 1 ? this.payload.page - 1 : null,
          nextPage: this.payload.page < Math.ceil((response.data.total || response.data.rates.length) / this.payload.limit) ? this.payload.page + 1 : null
        };
      } else {
        this.bannerRates = response.data || response;
      }

      // Validate and normalize response
      if (!this.bannerRates.docs || !Array.isArray(this.bannerRates.docs)) {
        this.bannerRates.docs = [];
      }
      if (!this.bannerRates.totalDocs || isNaN(this.bannerRates.totalDocs)) {
        this.bannerRates.totalDocs = 0;
      }
      if (!this.bannerRates.totalPages || isNaN(this.bannerRates.totalPages)) {
        this.bannerRates.totalPages = 1;
      }
      if (!this.bannerRates.page || isNaN(this.bannerRates.page)) {
        this.bannerRates.page = 1;
      }
      
      this.payload.page = this.bannerRates.page;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching banner rates:', error);
      swalHelper.showToast('Failed to fetch banner rates', 'error');
      this.bannerRates = {
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
    this.fetchBannerRates();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchBannerRates();
    }
  }

  openAddRateModal(): void {
    this.editMode = false;
    this.resetForm();
    this.showModal();
  }

  openEditRateModal(rate: BannerRate): void {
    this.editMode = true;
    this.selectedRate = rate;
    this.newRate = {
      days: rate.days,
      cost: rate.cost,
      isActive: rate.isActive
    };
    this.showModal();
  }

  resetForm(): void {
    this.newRate = {
      days: null,
      cost: null,
      isActive: true
    };
    this.formSubmitted = false;
  }
  
  showModal(): void {
    this.cdr.detectChanges();
    
    if (this.rateModal) {
      this.rateModal.show();
    } else {
      try {
        const modalElement = document.getElementById('rateModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.rateModal = modalInstance;
          modalInstance.show();
        } else {
          $('#rateModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        $('#rateModal').modal('show');
      }
    }
  }
  
  closeModal(): void {
    if (this.rateModal) {
      this.rateModal.hide();
    } else {
      $('#rateModal').modal('hide');
    }
  }

  async saveRate(form: any): Promise<void> {
    this.formSubmitted = true;
    
    try {
      if (!this.newRate.days || this.newRate.days <= 0) {
        swalHelper.showToast('Please enter valid number of days', 'warning');
        return;
      }

      if (!this.newRate.cost || this.newRate.cost <= 0) {
        swalHelper.showToast('Please enter valid cost', 'warning');
        return;
      }

      this.loading = true;

      const requestData = {
        days: this.newRate.days,
        cost: this.newRate.cost,
        isActive: this.newRate.isActive
      };

      const response = this.editMode && this.selectedRate
        ? await this.bannerRateService.updateBannerRate(this.selectedRate._id, requestData)
        : await this.bannerRateService.createBannerRate(requestData);

      if (response && response.success) {
        swalHelper.showToast(`Banner rate ${this.editMode ? 'updated' : 'created'} successfully`, 'success');
        this.closeModal();
        this.fetchBannerRates();
      } else {
        swalHelper.showToast(response?.message || `Failed to ${this.editMode ? 'update' : 'create'} banner rate`, 'error');
      }
    } catch (error: any) {
      console.error('Error saving banner rate:', error);
      swalHelper.showToast(error?.response?.data?.message || error?.message || 'Failed to save banner rate', 'error');
    } finally {
      this.loading = false;
    }
  }

  async toggleRateStatus(rate: BannerRate): Promise<void> {
    try {
      this.loading = true;
      
      const updatedStatus = !rate.isActive;
      
      const requestData = {
        days: rate.days,
        cost: rate.cost,
        isActive: updatedStatus
      };
      
      const response = await this.bannerRateService.updateBannerRate(rate._id, requestData);
      
      if (response && response.success) {
        rate.isActive = updatedStatus;
        swalHelper.showToast(`Banner rate status changed to ${updatedStatus ? 'Active' : 'Inactive'}`, 'success');
      } else {
        swalHelper.showToast(response.message || 'Failed to update banner rate status', 'error');
      }
    } catch (error) {
      console.error('Error updating banner rate status:', error);
      swalHelper.showToast('Failed to update banner rate status', 'error');
    } finally {
      this.loading = false;
    }
  }

  async deleteRate(rateId: string): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete Banner Rate',
        'Are you sure you want to delete this banner rate? This action cannot be undone.',
        'warning'
      );
      
      if (result.isConfirmed) {
        this.loading = true;
        
        try {
          const response = await this.bannerRateService.deleteBannerRate(rateId);
          
          if (response && response.success) {
            swalHelper.showToast('Banner rate deleted successfully', 'success');
            this.fetchBannerRates();
          } else {
            swalHelper.showToast(response.message || 'Failed to delete banner rate', 'error');
          }
        } catch (error) {
          console.error('Error deleting banner rate:', error);
          swalHelper.showToast('Failed to delete banner rate', 'error');
        } finally {
          this.loading = false;
        }
      }
    } catch (error) {
      console.error('Confirmation dialog error:', error);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  getDurationText(days: number): string {
    if (days === 1) return '1 Day';
    if (days < 30) return `${days} Days`;
    if (days === 30) return '1 Month';
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) return `${months} Month${months > 1 ? 's' : ''}`;
      return `${months} Month${months > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${years} Year${years > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
  }
}