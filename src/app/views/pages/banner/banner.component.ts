import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/env/env.local';

import { BannerService, Banner, BannerResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
declare var bootstrap: any;
declare var $: any;


@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [BannerService],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
})
export class BannersComponent implements OnInit, AfterViewInit {
  banners: BannerResponse = {
    banners: [],
    total: 0
  };
  
  loading: boolean = false;
  searchQuery: string = '';
  selectedBanner: Banner | null = null;
  selectedBannerForPreview: Banner | null = null;
  bannerModal: any;
  imagePreviewModal: any;
  editMode: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imageurl = environment.imageUrl;
  formSubmitted: boolean = false;
  
  newBanner = {
    title: '',
    description: '',
    image: null as File | null,
    redirectUrl: '',
    contact: '',
    fromDate: '',
    toDate: '',
    isActive: true
  };
  
  private searchSubject = new Subject<string>();
  
  payload = {
    search: '',
    page: 1,
    limit: 10
  };

  constructor(
    private bannerService: BannerService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.fetchBanners();
    });
  }

  ngOnInit(): void {
    this.fetchBanners();
  }

  ngAfterViewInit(): void {
    // Initialize modal properly with a delay to ensure DOM is fully loaded
    setTimeout(() => {
      const modalElement = document.getElementById('bannerModal');
      if (modalElement) {
        this.bannerModal = new bootstrap.Modal(modalElement);
      }
      
      const imagePreviewModalElement = document.getElementById('imagePreviewModal');
      if (imagePreviewModalElement) {
        this.imagePreviewModal = new bootstrap.Modal(imagePreviewModalElement);
      }
    }, 300);
  }

  async fetchBanners(): Promise<void> {
    this.loading = true;
    
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search
      };
      
      const response = await this.bannerService.getBanners(requestData);
      this.banners = response.data || response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching banners:', error);
      swalHelper.showToast('Failed to fetch banners', 'error');
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
    this.fetchBanners();
  }

  onPageChange(page: number): void {
    this.payload.page = page;
    this.fetchBanners();
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        swalHelper.showToast('Please select a valid image file (JPG, PNG, GIF)', 'error');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 10 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        swalHelper.showToast('File size should not exceed 10MB', 'error');
        return;
      }

      

    // Validate image dimensions
    const img = new Image();
    img.src = window.URL.createObjectURL(file);
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const requiredWidth = 300;
      const requiredHeight = 160;

      if (width !== requiredWidth || height !== requiredHeight) {
        swalHelper.showToast(`Image must be ${requiredWidth}x${requiredHeight} pixels`, 'error');
        window.URL.revokeObjectURL(img.src);
        return;
      }

      this.selectedFile = file;
      this.newBanner.image = file;

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      swalHelper.showToast('Failed to load image for validation', 'error');
      window.URL.revokeObjectURL(img.src);
    };
  }
}

  openAddBannerModal(): void {
    this.editMode = false;
    this.resetForm();
    this.showModal();
  }

  openEditBannerModal(banner: Banner): void {
    this.editMode = true;
    this.selectedBanner = banner;
    this.newBanner = {
      title: banner.title,
      description: banner.description,
      image: null,
      redirectUrl: banner.redirectUrl,
      contact: banner.contact,
      fromDate: banner.fromDate ? this.formatDateForInput(banner.fromDate) : '',
      toDate: banner.toDate ? this.formatDateForInput(banner.toDate) : '',
      isActive: banner.isActive
    };
    
    // Set image preview if banner has an image
    if (banner.image) {
      this.imagePreview = this.getImageUrl(banner.image);
    } else {
      this.imagePreview = null;
    }
    
    this.showModal();
  }

  openImagePreview(banner: Banner): void {
    this.selectedBannerForPreview = banner;
    this.showImagePreviewModal();
  }

  resetForm(): void {
    this.newBanner = {
      title: '',
      description: '',
      image: null,
      redirectUrl: '',
      contact: '',
      fromDate: '',
      toDate: '',
      isActive: true
    };
    this.selectedFile = null;
    this.imagePreview = null;
    this.formSubmitted = false;
  }
  
  showModal(): void {
    // Force detect changes
    this.cdr.detectChanges();
    
    if (this.bannerModal) {
      this.bannerModal.show();
    } else {
      try {
        const modalElement = document.getElementById('bannerModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.bannerModal = modalInstance;
          modalInstance.show();
        } else {
          // Fallback to jQuery
          $('#bannerModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        // Last resort fallback
        $('#bannerModal').modal('show');
      }
    }
  }

  showImagePreviewModal(): void {
    // Force detect changes
    this.cdr.detectChanges();
    
    if (this.imagePreviewModal) {
      this.imagePreviewModal.show();
    } else {
      try {
        const modalElement = document.getElementById('imagePreviewModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.imagePreviewModal = modalInstance;
          modalInstance.show();
        } else {
          // Fallback to jQuery
          $('#imagePreviewModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing image preview modal:', error);
        // Last resort fallback
        $('#imagePreviewModal').modal('show');
      }
    }
  }
  
  closeModal(): void {
    if (this.bannerModal) {
      this.bannerModal.hide();
    } else {
      $('#bannerModal').modal('hide');
    }
  }

  async saveBanner(form: any): Promise<void> {
    this.formSubmitted = true;
    
    try {
      // Validation checks
      if (!this.newBanner.title?.trim()) {
        swalHelper.showToast('Please enter a banner title', 'warning');
        return;
      }

      if (!this.editMode && !this.newBanner.image) {
        swalHelper.showToast('Please select a banner image', 'warning');
        return;
      }

      // Validate URL format if provided
      if (this.newBanner.redirectUrl && this.newBanner.redirectUrl.trim()) {
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(this.newBanner.redirectUrl)) {
          swalHelper.showToast('Please enter a valid URL (must start with http:// or https://)', 'warning');
          return;
        }
      }

      // Validate date range
      if (this.newBanner.fromDate && this.newBanner.toDate) {
        const fromDate = new Date(this.newBanner.fromDate);
        const toDate = new Date(this.newBanner.toDate);
        
        if (fromDate >= toDate) {
          swalHelper.showToast('From date should be before to date', 'warning');
          return;
        }
      }

      this.loading = true;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', this.newBanner.title.trim());
      formData.append('description', this.newBanner.description?.trim() || '');
      formData.append('redirectUrl', this.newBanner.redirectUrl?.trim() || '');
      formData.append('contact', this.newBanner.contact?.trim() || '');
      formData.append('fromDate', this.newBanner.fromDate || '');
      formData.append('toDate', this.newBanner.toDate || '');
      formData.append('isActive', this.newBanner.isActive.toString());

      if (this.newBanner.image) {
        formData.append('image', this.newBanner.image);
      }

      const response = this.editMode && this.selectedBanner
        ? await this.bannerService.updateBanner(this.selectedBanner._id, formData)
        : await this.bannerService.createBanner(formData);

      console.log('Response:', response); // Debug log

      if (response && response.success) {
        swalHelper.showToast(`Banner ${this.editMode ? 'updated' : 'created'} successfully`, 'success');
        this.closeModal();
        this.fetchBanners();
      } else {
        swalHelper.showToast(response?.message || `Failed to ${this.editMode ? 'update' : 'create'} banner`, 'error');
      }
    } catch (error: any) {
      console.error('Error saving banner:', error);
      swalHelper.showToast(error?.response?.data?.message || error?.message || 'Failed to save banner', 'error');
    } finally {
      this.loading = false;
    }
  }

  async toggleBannerStatus(banner: Banner): Promise<void> {
    try {
      this.loading = true;
      
      const updatedStatus = !banner.isActive;
      
      // Create FormData for status update
      const formData = new FormData();
      formData.append('title', banner.title);
      formData.append('description', banner.description || '');
      formData.append('redirectUrl', banner.redirectUrl || '');
      formData.append('contact', banner.contact || '');
      formData.append('fromDate', banner.fromDate || '');
      formData.append('toDate', banner.toDate || '');
      formData.append('isActive', updatedStatus.toString());
      
      const response = await this.bannerService.updateBanner(banner._id, formData);
      
      if (response && response.success) {
        banner.isActive = updatedStatus;
        swalHelper.showToast(`Banner status changed to ${updatedStatus ? 'Active' : 'Inactive'}`, 'success');
      } else {
        swalHelper.showToast(response.message || 'Failed to update banner status', 'error');
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
      swalHelper.showToast('Failed to update banner status', 'error');
    } finally {
      this.loading = false;
    }
  }

  async deleteBanner(bannerId: string): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete Banner',
        'Are you sure you want to delete this banner? This action cannot be undone.',
        'warning'
      );
      
      if (result.isConfirmed) {
        this.loading = true;
        
        try {
          const response = await this.bannerService.deleteBanner(bannerId);
          
          if (response && response.success) {
            swalHelper.showToast('Banner deleted successfully', 'success');
            this.fetchBanners();
          } else {
            swalHelper.showToast(response.message || 'Failed to delete banner', 'error');
          }
        } catch (error) {
          console.error('Error deleting banner:', error);
          swalHelper.showToast('Failed to delete banner', 'error');
        } finally {
          this.loading = false;
        }
      }
    } catch (error) {
      console.error('Confirmation dialog error:', error);
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
    // Adjust this base URL according to your backend configuration
    const baseUrl = this.imageurl; // Change this to your API base URL
    return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
  }
}