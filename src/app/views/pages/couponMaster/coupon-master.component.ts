import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/env/env.local';
import { CouponService, Coupon, CouponResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-coupon-master',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  templateUrl: './coupon-master.component.html',
  styleUrls: ['./coupon-master.component.css'],
})
export class CouponMasterComponent implements OnInit, AfterViewInit {
  coupons: CouponResponse = {
    coupons: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false
  };
  
  loading: boolean = false;
  searchQuery: string = '';
  selectedCoupon: Coupon | null = null;
  selectedCouponForView: Coupon | null = null;
  couponModal: any;
  viewDetailModal: any;
  editMode: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imageurl = environment.imageUrl;
  formSubmitted: boolean = false;
  loadingDetail: boolean = false;
  
  discountTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed Amount' }
  ];
  
  eventTypeOptions = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' }
  ];
  
  statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'upcoming', label: 'Upcoming' }
  ];
  
  newCoupon = {
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null as number | null,
    validFrom: '',
    validUntil: '',
    usageLimit: 0,
    perUserLimit: 1,
    applicableEventTypes: [] as string[],
    isActive: true,
    image: null as File | null
  };
  
  // Validation errors
  validationErrors: any = {
    code: '',
    title: ''
  };
  
  selectedStatusFilter: string = 'all';
  selectedDiscountTypeFilter: string = '';
  
  private searchSubject = new Subject<string>();
  
  payload = {
    search: '',
    page: 1,
    limit: 10,
    isActive: undefined as any,
    discountType: '',
    status: 'all'
  };

  constructor(
    private couponService: CouponService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.fetchCoupons();
    });
  }

  ngOnInit(): void {
    this.fetchCoupons();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('couponModal');
      if (modalElement) {
        this.couponModal = new bootstrap.Modal(modalElement);
      }
      
      const viewDetailModalElement = document.getElementById('viewDetailModal');
      if (viewDetailModalElement) {
        this.viewDetailModal = new bootstrap.Modal(viewDetailModalElement);
      }
      
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchCoupons(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        isActive: this.payload.isActive,
        discountType: this.payload.discountType || undefined,
        status: this.payload.status
      };
      
      const response = await this.couponService.getCoupons(requestData);
      this.coupons = response.data || response;
      
      // Normalize response
      if (!this.coupons.coupons || !Array.isArray(this.coupons.coupons)) {
        this.coupons.coupons = [];
      }
      if (!this.coupons.total || isNaN(this.coupons.total)) {
        this.coupons.total = 0;
      }
      if (!this.coupons.totalPages || isNaN(this.coupons.totalPages)) {
        this.coupons.totalPages = 1;
      }
      if (!this.coupons.page || isNaN(this.coupons.page)) {
        this.coupons.page = 1;
      }
      
      this.payload.page = this.coupons.page;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching coupons:', error);
      swalHelper.showToast('Failed to fetch coupons', 'error');
      this.coupons = {
        coupons: [],
        total: 0,
        page: this.payload.page,
        limit: this.payload.limit,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false
      };
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
    this.fetchCoupons();
  }
  
  onStatusFilterChange(): void {
    this.payload.status = this.selectedStatusFilter;
    this.payload.page = 1;
    this.fetchCoupons();
  }
  
  onDiscountTypeFilterChange(): void {
    this.payload.discountType = this.selectedDiscountTypeFilter;
    this.payload.page = 1;
    this.fetchCoupons();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchCoupons();
    }
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        swalHelper.showToast('Please select a valid image file (JPG, PNG, GIF)', 'error');
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        swalHelper.showToast('File size should not exceed 10MB', 'error');
        return;
      }

      this.selectedFile = file;
      this.newCoupon.image = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  openAddCouponModal(): void {
    this.editMode = false;
    this.resetForm();
    this.showModal();
  }

  openEditCouponModal(coupon: Coupon): void {
    // Close view detail modal if open
    if (this.viewDetailModal) {
      this.viewDetailModal.hide();
    }
    
    this.editMode = true;
    this.selectedCoupon = coupon;
    this.newCoupon = {
      code: coupon.code,
      title: coupon.title,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || null,
      validFrom: coupon.validFrom ? this.formatDateForInput(coupon.validFrom) : '',
      validUntil: coupon.validUntil ? this.formatDateForInput(coupon.validUntil) : '',
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit || 1,
      applicableEventTypes: coupon.applicableEventTypes || [],
      isActive: coupon.isActive,
      image: null
    };
    
    if (coupon.image) {
      this.imagePreview = this.getImageUrl(coupon.image);
    } else {
      this.imagePreview = null;
    }
    
    this.showModal();
  }

  resetForm(): void {
    this.newCoupon = {
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      validFrom: '',
      validUntil: '',
      usageLimit: 0,
      perUserLimit: 1,
      applicableEventTypes: [],
      isActive: true,
      image: null
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.formSubmitted = false;
    this.validationErrors = {
      code: '',
      title: ''
    };
  }

  validateCode(): boolean {
    const code = this.newCoupon.code?.trim();
    if (!code) {
      this.validationErrors.code = 'Coupon code is required';
      return false;
    }
    if (code.length > 35) {
      this.validationErrors.code = 'Coupon code must not exceed 35 characters';
      return false;
    }
    this.validationErrors.code = '';
    return true;
  }

  validateTitle(): boolean {
    const title = this.newCoupon.title?.trim();
    if (!title) {
      this.validationErrors.title = 'Title is required';
      return false;
    }
    if (title.length > 80) {
      this.validationErrors.title = 'Title must not exceed 80 characters';
      return false;
    }
    this.validationErrors.title = '';
    return true;
  }

  onCodeChange(): void {
    if (this.newCoupon.code && this.newCoupon.code.length > 35) {
      this.newCoupon.code = this.newCoupon.code.substring(0, 35);
    }
    this.validateCode();
  }

  onTitleChange(): void {
    if (this.newCoupon.title && this.newCoupon.title.length > 80) {
      this.newCoupon.title = this.newCoupon.title.substring(0, 80);
    }
    this.validateTitle();
  }
  
  showModal(): void {
    this.cdr.detectChanges();
    if (this.couponModal) {
      this.couponModal.show();
    } else {
      try {
        const modalElement = document.getElementById('couponModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.couponModal = modalInstance;
          modalInstance.show();
        } else {
          $('#couponModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        $('#couponModal').modal('show');
      }
    }
  }
  
  closeModal(): void {
    if (this.couponModal) {
      this.couponModal.hide();
    } else {
      $('#couponModal').modal('hide');
    }
  }

  toggleEventType(eventType: string): void {
    const index = this.newCoupon.applicableEventTypes.indexOf(eventType);
    if (index > -1) {
      this.newCoupon.applicableEventTypes.splice(index, 1);
    } else {
      this.newCoupon.applicableEventTypes.push(eventType);
    }
  }

  async saveCoupon(form: any): Promise<void> {
    this.formSubmitted = true;
    
    try {
      // Validation
      if (!this.validateCode()) {
        swalHelper.showToast(this.validationErrors.code, 'warning');
        return;
      }

      if (!this.validateTitle()) {
        swalHelper.showToast(this.validationErrors.title, 'warning');
        return;
      }

      if (!this.newCoupon.discountValue || this.newCoupon.discountValue <= 0) {
        swalHelper.showToast('Please enter a valid discount value', 'warning');
        return;
      }

      if (this.newCoupon.discountType === 'percentage' && this.newCoupon.discountValue > 100) {
        swalHelper.showToast('Percentage discount cannot exceed 100%', 'warning');
        return;
      }

      // Mandatory date validation
      if (!this.newCoupon.validFrom || !this.newCoupon.validUntil) {
        swalHelper.showToast('Valid From and Valid Until dates are required', 'warning');
        return;
      }

      if (this.newCoupon.validFrom && this.newCoupon.validUntil) {
        const fromDate = new Date(this.newCoupon.validFrom);
        const toDate = new Date(this.newCoupon.validUntil);
        
        if (fromDate >= toDate) {
          swalHelper.showToast('Valid until date must be after valid from date', 'warning');
          return;
        }
      }

      this.loading = true;

      const formData = new FormData();
      formData.append('code', this.newCoupon.code.trim().toUpperCase());
      formData.append('title', this.newCoupon.title.trim());
      formData.append('description', this.newCoupon.description?.trim() || '');
      formData.append('discountType', this.newCoupon.discountType);
      formData.append('discountValue', this.newCoupon.discountValue.toString());
      formData.append('minOrderAmount', this.newCoupon.minOrderAmount?.toString() || '0');
      
      if (this.newCoupon.maxDiscountAmount !== null && this.newCoupon.maxDiscountAmount !== undefined) {
        formData.append('maxDiscountAmount', this.newCoupon.maxDiscountAmount.toString());
      }
      
      formData.append('validFrom', this.newCoupon.validFrom || '');
      formData.append('validUntil', this.newCoupon.validUntil || '');
      formData.append('usageLimit', this.newCoupon.usageLimit?.toString() || '0');
      formData.append('perUserLimit', this.newCoupon.perUserLimit?.toString() || '1');
      formData.append('isActive', this.newCoupon.isActive.toString());
      
      // Append event types as array
      this.newCoupon.applicableEventTypes.forEach((type, index) => {
        formData.append(`applicableEventTypes[${index}]`, type);
      });

      if (this.newCoupon.image) {
        formData.append('image', this.newCoupon.image);
      }

      const response = this.editMode && this.selectedCoupon
        ? await this.couponService.updateCoupon(this.selectedCoupon._id, formData)
        : await this.couponService.createCoupon(formData);

      if (response && response.success) {
        swalHelper.showToast(`Coupon ${this.editMode ? 'updated' : 'created'} successfully`, 'success');
        this.closeModal();
        this.fetchCoupons();
      } else {
        swalHelper.showToast(response?.message || `Failed to ${this.editMode ? 'update' : 'create'} coupon`, 'error');
      }
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      swalHelper.showToast(error?.response?.data?.message || error?.message || 'Failed to save coupon', 'error');
    } finally {
      this.loading = false;
    }
  }

  async deleteCoupon(coupon: Coupon): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete Coupon',
        'Are you sure you want to delete this coupon? This action cannot be undone.',
        'warning'
      );
      
      if (result.isConfirmed) {
        this.loading = true;
        
        try {
          // Use update API with isDeleted: true
          const formData = new FormData();
          formData.append('code', coupon.code);
          formData.append('title', coupon.title);
          formData.append('description', coupon.description || '');
          formData.append('discountType', coupon.discountType);
          formData.append('discountValue', coupon.discountValue.toString());
          formData.append('minOrderAmount', (coupon.minOrderAmount || 0).toString());
          
          if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
            formData.append('maxDiscountAmount', coupon.maxDiscountAmount.toString());
          }
          
          formData.append('validFrom', coupon.validFrom || '');
          formData.append('validUntil', coupon.validUntil || '');
          formData.append('usageLimit', (coupon.usageLimit || 0).toString());
          formData.append('perUserLimit', (coupon.perUserLimit || 1).toString());
          formData.append('isActive', coupon.isActive.toString());
          formData.append('isDeleted', 'true');
          
          if (coupon.applicableEventTypes && coupon.applicableEventTypes.length > 0) {
            coupon.applicableEventTypes.forEach((type, index) => {
              formData.append(`applicableEventTypes[${index}]`, type);
            });
          }
          
          const response = await this.couponService.updateCoupon(coupon._id, formData);
          
          if (response && response.success) {
            swalHelper.showToast('Coupon deleted successfully', 'success');
            this.fetchCoupons();
          } else {
            swalHelper.showToast(response?.message || 'Failed to delete coupon', 'error');
          }
        } catch (error) {
          console.error('Error deleting coupon:', error);
          swalHelper.showToast('Failed to delete coupon', 'error');
        } finally {
          this.loading = false;
        }
      }
    } catch (error) {
      console.error('Confirmation dialog error:', error);
    }
  }

  async openViewDetailModal(coupon: Coupon): Promise<void> {
    this.loadingDetail = true;
    this.selectedCouponForView = null;
    
    try {
      // Fetch full coupon details using GET API
      const response = await this.couponService.getCouponById(coupon._id);
      
      if (response && response.success && response.data?.coupon) {
        this.selectedCouponForView = response.data.coupon;
      } else {
        // Fallback to use the coupon from list if API fails
        this.selectedCouponForView = coupon;
      }
      
      this.showViewDetailModal();
    } catch (error) {
      console.error('Error fetching coupon details:', error);
      // Fallback to use the coupon from list
      this.selectedCouponForView = coupon;
      this.showViewDetailModal();
    } finally {
      this.loadingDetail = false;
    }
  }

  showViewDetailModal(): void {
    this.cdr.detectChanges();
    if (this.viewDetailModal) {
      this.viewDetailModal.show();
    } else {
      try {
        const modalElement = document.getElementById('viewDetailModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.viewDetailModal = modalInstance;
          modalInstance.show();
        } else {
          $('#viewDetailModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing view detail modal:', error);
        $('#viewDetailModal').modal('show');
      }
    }
  }

  closeViewDetailModal(): void {
    if (this.viewDetailModal) {
      this.viewDetailModal.hide();
    } else {
      $('#viewDetailModal').modal('hide');
    }
  }

  // Helper methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    const baseUrl = this.imageurl;
    return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
  }

  getStatusBadgeClass(coupon: Coupon): string {
    if (!coupon.isActive) {
      return 'bg-secondary';
    }
    
    const now = new Date();
    const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;
    
    if (validUntil && validUntil < now) {
      return 'bg-danger';
    }
    if (validFrom && validFrom > now) {
      return 'bg-info';
    }
    return 'bg-success';
  }

  getStatusBadgeText(coupon: Coupon): string {
    if (!coupon.isActive) {
      return 'Inactive';
    }
    
    const now = new Date();
    const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;
    
    if (validUntil && validUntil < now) {
      return 'Expired';
    }
    if (validFrom && validFrom > now) {
      return 'Upcoming';
    }
    return 'Active';
  }

  formatDiscount(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return `₹${coupon.discountValue}`;
  }

  truncateDescription(description: string, maxWords: number = 100): string {
    if (!description) return '';
    const words = description.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length <= maxWords) {
      return description;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  }

  shouldShowMore(description: string): boolean {
    if (!description || !description.trim()) return false;
    const words = description.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length > 100;
  }
}

