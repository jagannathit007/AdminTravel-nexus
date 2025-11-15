import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/env/env.local';
import { PhotoCategoryService, PhotoCategory, PhotoCategoryResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
declare var bootstrap: any;
declare var $: any;

@Component({
  selector: 'app-photo-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [PhotoCategoryService],
  templateUrl: './photo-categories.component.html',
  styleUrls: ['./photo-categories.component.css'],
})
export class PhotoCategoriesComponent implements OnInit, AfterViewInit {
  photoCategories: PhotoCategoryResponse = {
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
  selectedCategory: PhotoCategory | null = null;
  selectedCategoryForPreview: PhotoCategory | null = null;
  categoryModal: any;
  categoryPreviewModal: any;
  editMode: boolean = false;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  imageurl = environment.imageUrl;
  formSubmitted: boolean = false;

  newCategory = {
    category: '',
    title: '',
    description: '',
    images: [] as File[]
  };

  private searchSubject = new Subject<string>();

  payload = {
    page: 1,
    limit: 10
  };

  constructor(
    private photoCategoryService: PhotoCategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(500)
    ).subscribe(() => {
      this.fetchPhotoCategories();
    });
  }

  ngOnInit(): void {
    this.fetchPhotoCategories();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('categoryModal');
      if (modalElement) {
        this.categoryModal = new bootstrap.Modal(modalElement);
      }

      const previewModalElement = document.getElementById('categoryPreviewModal');
      if (previewModalElement) {
        this.categoryPreviewModal = new bootstrap.Modal(previewModalElement);
      }
      this.cdr.detectChanges();
    }, 300);
  }

  async fetchPhotoCategories(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit
      };
      const response = await this.photoCategoryService.getAllPhotoCategories(requestData);
      this.photoCategories = response.data || response;
      
      // Validate and normalize response
      if (!this.photoCategories.docs || !Array.isArray(this.photoCategories.docs)) {
        this.photoCategories.docs = [];
      }
      if (!this.photoCategories.totalDocs || isNaN(this.photoCategories.totalDocs)) {
        this.photoCategories.totalDocs = 0;
      }
      if (!this.photoCategories.totalPages || isNaN(this.photoCategories.totalPages)) {
        this.photoCategories.totalPages = 1;
      }
      if (!this.photoCategories.page || isNaN(this.photoCategories.page)) {
        this.photoCategories.page = 1;
      }
      
      this.payload.page = this.photoCategories.page;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching photo categories:', error);
      swalHelper.showToast('Failed to fetch photo categories', 'error');
      this.photoCategories = {
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
    this.searchSubject.next(this.searchQuery);
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchPhotoCategories();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchPhotoCategories();
    }
  }

  onImagesSelect(event: any): void {
    const newFiles = Array.from(event.target.files) as File[];
    if (newFiles.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 10;

    // Calculate total files after adding new ones
    const totalFilesAfterAdd = this.selectedFiles.length + newFiles.length;

    if (totalFilesAfterAdd > maxFiles) {
      swalHelper.showToast(`Maximum ${maxFiles} images allowed. You already have ${this.selectedFiles.length} selected.`, 'error');
      // Reset the input
      event.target.value = '';
      return;
    }

    // Validate each new file
    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        swalHelper.showToast('Please select valid image files (JPG, PNG)', 'error');
        // Reset the input
        event.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        swalHelper.showToast('File size should not exceed 5MB per image', 'error');
        // Reset the input
        event.target.value = '';
        return;
      }
    }

    // Append new files to existing ones
    this.selectedFiles = [...this.selectedFiles, ...newFiles];
    this.newCategory.images = this.selectedFiles;
    this.generateImagePreviews();
  }

  generateImagePreviews(): void {
    this.imagePreviews = [];
    
    for (const file of this.selectedFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImagePreview(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    this.newCategory.images = this.selectedFiles;
    this.cdr.detectChanges();
  }

  openAddCategoryModal(): void {
    this.editMode = false;
    this.resetForm();
    this.showModal();
  }

  openEditCategoryModal(category: PhotoCategory): void {
    this.editMode = true;
    this.selectedCategory = category;
    this.newCategory = {
      category: category.category,
      title: category.title,
      description: category.description,
      images: []
    };
    
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.showModal();
  }

  async openCategoryPreview(category: PhotoCategory): Promise<void> {
    try {
      this.loading = true;
      const response = await this.photoCategoryService.getCategoryById(category._id);
      this.selectedCategoryForPreview = response.data.categoryPhoto;
      this.showCategoryPreviewModal();
    } catch (error) {
      console.error('Error fetching category details:', error);
      swalHelper.showToast('Failed to fetch category details', 'error');
    } finally {
      this.loading = false;
    }
  }

  async removeImageFromCategory(imageUrl: string): Promise<void> {
    if (!this.selectedCategoryForPreview) return;

    try {
      const result = await swalHelper.confirmation(
        'Remove Image',
        'Are you sure you want to remove this image from the category?',
        'warning'
      );

      if (result.isConfirmed) {
        this.loading = true;
        const response = await this.photoCategoryService.removeImageFromCategory(
          this.selectedCategoryForPreview._id,
          imageUrl
        );

        if (response && response.success) {
          this.selectedCategoryForPreview = response.data.categoryPhoto;
          swalHelper.showToast('Image removed successfully', 'success');
          this.fetchPhotoCategories(); // Refresh the list
        } else {
          swalHelper.showToast(response.message || 'Failed to remove image', 'error');
        }
      }
    } catch (error) {
      console.error('Error removing image:', error);
      swalHelper.showToast('Failed to remove image', 'error');
    } finally {
      this.loading = false;
    }
  }

  resetForm(): void {
    this.newCategory = {
      category: '',
      title: '',
      description: '',
      images: []
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.formSubmitted = false;
  }

  showModal(): void {
    this.cdr.detectChanges();

    if (this.categoryModal) {
      this.categoryModal.show();
    } else {
      try {
        const modalElement = document.getElementById('categoryModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.categoryModal = modalInstance;
          modalInstance.show();
        } else {
          $('#categoryModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        $('#categoryModal').modal('show');
      }
    }
  }

  showCategoryPreviewModal(): void {
    this.cdr.detectChanges();

    if (this.categoryPreviewModal) {
      this.categoryPreviewModal.show();
    } else {
      try {
        const modalElement = document.getElementById('categoryPreviewModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.categoryPreviewModal = modalInstance;
          modalInstance.show();
        } else {
          $('#categoryPreviewModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing preview modal:', error);
        $('#categoryPreviewModal').modal('show');
      }
    }
  }

  closeModal(): void {
    if (this.categoryModal) {
      this.categoryModal.hide();
    } else {
      $('#categoryModal').modal('hide');
    }
  }

  async saveCategory(): Promise<void> {
    this.formSubmitted = true;

    try {
      if (!this.newCategory.category?.trim()) {
        swalHelper.showToast('Please enter a category name', 'warning');
        return;
      }

      if (!this.newCategory.title?.trim()) {
        swalHelper.showToast('Please enter a title', 'warning');
        return;
      }

      if (!this.editMode && this.selectedFiles.length === 0) {
        swalHelper.showToast('Please select at least one image', 'warning');
        return;
      }

      this.loading = true;

      const formData = new FormData();
      formData.append('category', this.newCategory.category.trim());
      formData.append('title', this.newCategory.title.trim());
      formData.append('description', this.newCategory.description?.trim() || '');

      for (const file of this.selectedFiles) {
        formData.append('images', file);
      }

      const response = this.editMode && this.selectedCategory
        ? await this.photoCategoryService.updatePhotoCategory(this.selectedCategory._id, formData)
        : await this.photoCategoryService.createPhotoCategory(formData);

      if (response && response.success) {
        swalHelper.showToast(`Category ${this.editMode ? 'updated' : 'created'} successfully`, 'success');
        this.closeModal();
        this.fetchPhotoCategories();
      } else {
        swalHelper.showToast(response?.message || `Failed to ${this.editMode ? 'update' : 'create'} category`, 'error');
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      swalHelper.showToast(error?.response?.data?.message || error?.message || 'Failed to save category', 'error');
    } finally {
      this.loading = false;
    }
  }

  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete Category',
        'Are you sure you want to delete this category? This action cannot be undone and will remove all images.',
        'warning'
      );

      if (result.isConfirmed) {
        this.loading = true;

        try {
          const response = await this.photoCategoryService.deletePhotoCategory(categoryId);

          if (response && response.success) {
            swalHelper.showToast('Category deleted successfully', 'success');
            this.fetchPhotoCategories();
          } else {
            swalHelper.showToast(response.message || 'Failed to delete category', 'error');
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          swalHelper.showToast('Failed to delete category', 'error');
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

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    const baseUrl = this.imageurl;
    return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
  }

  getImageCount(category: PhotoCategory): number {
    return category.images ? category.images.length : 0;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-image.png';
  }
}