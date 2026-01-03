import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuthService,
  City,
  CityService,
  Country,
  CountryService,
  DmcListService,
  State,
  StateService,
  User,
} from '../../../services/auth.service';
import { ReferralService1 } from '../../../services/auth.service';
import { ExportService } from '../../../services/export.service';
import { ChapterService } from '../../../services/auth.service';
import { RegionService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

declare var $: any;
declare var bootstrap: any;

// Interface for Region Object
interface RegionObject {
  _id: string;
  name: string;
  description: string;
  countries: string[];
}

// Interface for ExtendedUser
interface ExtendedUser {
  _id: string;
  name: string;
  email: string;
  mobile_number: string;
  chapter_name: string;
  meeting_role: string;
  induction_date: string;
  profilePic: string;
  date_of_birth: string;
  city: string;
  state: string;
  country: string;
  sponseredBy: string;
  status: boolean;
  createdAt: string;
  keywords: string;

  business_name: string;
  business_type: string; // Added business_type
  isMember: boolean;
  regions: RegionObject[];
  dmc_specializations: string[];
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [
    ExportService,
    StateService,
    CountryService,
    CityService,
    RegionService,
    DmcListService,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit, AfterViewInit {
  users: any = { docs: [], totalDocs: 0, limit: 10, page: 1, totalPages: 0 };
  chapters: any[] = [];
  regions: RegionObject[] = [];
  selectedChapter: string | null = null;
  loading: boolean = false;
  exporting: boolean = false;
  searchQuery: string = '';
  selectedUser: ExtendedUser | null = null;
  userDetailsModal: any;
  notificationModal: any;
  imageurl = environment.imageUrl;
  pathurl = environment.baseURL;
  activeTab: string = 'profile';
  referralTab: string = 'given';
  referralsGiven: any[] = [];
  referralsReceived: any[] = [];
  referralsGivenTotal: number = 0;
  referralsReceivedTotal: number = 0;
  referralLoading: boolean = false;
  dmcLoading: boolean = false;
  regionsLoading: boolean = false;
  pdfLoading: boolean = false;
  Math = Math;

  // Predefined arrays for specializations, services, and business types
  specializations: any[] = [];
  businessTypes: string[] = ['B2B', 'B2C', 'Both']; // Added business types

  notificationForm = {
    userId: '',
    title: '',
    description: '',
    message: '',
  };
  notificationError = {
    title: '',
    description: '',
  };
  notificationLoading: boolean = false;

  paginationConfig = {
    id: 'users-pagination',
  };
  editUserModal: any;
  editForm = {
    name: '',
    mobile_number: '',
    email: '',
    city: '',
    state: '',
    country: '',
    business_name: '',
    business_type: '', // Added business_type
    regions: [] as string[],
    dmc_specializations: [] as any[],
  };
  editError = {
    name: '',
    mobile_number: '',
    email: '',
    city: '',
    state: '',
    country: '',
    business_name: '',
    business_type: '', // Added business_type
    regions: '',
    dmc_specializations: '',
  };
  editLoading: boolean = false;

  referralPaginationConfig = {
    givenId: 'referrals-given-pagination',
    receivedId: 'referrals-received-pagination',
  };

  payload = {
    search: '',
    page: 1,
    limit: 10,
    chapter: '',
  };

  referralPayload = {
    page: 1,
    givenPage: 1,
    receivedPage: 1,
    limit: 5,
  };
  countries: Country[] = [];
  states: State[] = [];
  cities: City[] = [];

  countriesLoading: boolean = false;
  statesLoading: boolean = false;
  citiesLoading: boolean = false;
  usersLoading: boolean = false;

  countriesLoaded: boolean = false;
  statesLoaded: boolean = false;
  citiesLoaded: boolean = false;
  usersLoaded: boolean = false;

  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private referralService: ReferralService1,
    private dmcListService: DmcListService,
    private chapterService: ChapterService,
    private countryService: CountryService,
    private stateService: StateService,
    private cityService: CityService,
    private regionService: RegionService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchUsers();
    });
  }

  ngOnInit(): void {
    this.fetchChapters();
    this.fetchUsers();
    this.fetchDmcLists();
    // Only fetch regions initially - countries, states, cities will be fetched based on selections
    this.fetchRegions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const userModalElement = document.getElementById('userDetailsModal');
      if (userModalElement) {
        this.userDetailsModal = new bootstrap.Modal(userModalElement);
      } else {
        console.warn('User modal element not found in the DOM');
      }
      const editModalElement = document.getElementById('editUserModal');
      if (editModalElement) {
        this.editUserModal = new bootstrap.Modal(editModalElement);
      } else {
        console.warn('Edit user modal element not found in the DOM');
      }
      const notificationModalElement =
        document.getElementById('notificationModal');
      if (notificationModalElement) {
        this.notificationModal = new bootstrap.Modal(notificationModalElement);
      } else {
        console.warn('Notification modal element not found in the DOM');
      }

      // Initialize tooltips
      this.initializeTooltips();
    }, 300);
  }

  initializeTooltips(): void {
    setTimeout(() => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }, 500);
  }

  getRegionsTooltip(regions: RegionObject[]): string {
    if (!regions || regions.length <= 1) return '';

    const additionalRegions = regions.slice(1);
    return additionalRegions
      .map(
        (region) =>
          `${region.name} - Countries: ${region.countries?.join(', ') || 'N/A'}`
      )
      .join('\n');
  }

  getSpecializationsDisplay(specializations: string[]): string {
    if (!specializations || specializations.length === 0) return 'N/A';
    return specializations.join(', ');
  }

  getServicesDisplay(services: string[]): string {
    if (!services || services.length === 0) return 'N/A';
    return services.join(', ');
  }

  getRegionsDisplay(regions: RegionObject[]): string {
    if (!regions || regions.length === 0) return 'N/A';
    return regions
      .map(
        (region) => `${region.name} (${region.countries?.join(', ') || 'N/A'})`
      )
      .join(', ');
  }

  async fetchRegions(): Promise<void> {
    this.regionsLoading = true;
    try {
      const response = await this.regionService.getRegions({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.regions = response.docs;
    } catch (error) {
      console.error('Error fetching regions:', error);
      swalHelper.showToast('Failed to fetch regions', 'error');
    } finally {
      this.regionsLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchChapters(): Promise<void> {
    try {
      const chapters = await this.chapterService.getAllChaptersForDropdown();
      this.chapters = chapters;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching chapters:', error);
      swalHelper.showToast('Failed to fetch chapters', 'error');
    }
  }

  async fetchUsers(): Promise<void> {
    this.loading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
        chapter: this.payload.chapter,
      };
      const response = await this.authService.getUsers(requestData);
      if (response) {
        this.users = response;
        this.cdr.detectChanges();

        // Reinitialize tooltips after data loads
        this.initializeTooltips();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      swalHelper.showToast('Failed to fetch users', 'error');
      this.users = {
        docs: [],
        totalDocs: 0,
        limit: this.payload.limit,
        page: this.payload.page,
        totalPages: 0,
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

  onChapterChange(): void {
    this.payload.page = 1;
    this.payload.chapter = this.selectedChapter || '';
    this.payload.search = '';
    this.searchQuery = '';
    this.fetchUsers();
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/assets/images/placeholder-image.png';
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchUsers();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchUsers();
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'referrals' && this.selectedUser) {
      this.referralTab = 'given';
      this.referralsGiven = [];
      this.referralsReceived = [];
      this.referralPayload.givenPage = 1;
      this.referralPayload.receivedPage = 1;
      this.fetchReferrals();
    }
  }

  setReferralTab(tab: string): void {
    this.referralTab = tab;
    this.referralPayload.givenPage = 1;
    this.referralPayload.receivedPage = 1;
    this.fetchReferrals();
  }

  async fetchReferrals(): Promise<void> {
    if (!this.selectedUser?._id) {
      console.warn('No user ID available for fetching referrals');
      return;
    }

    this.referralLoading = true;
    try {
      let response;
      if (this.referralTab === 'given') {
        response = await this.referralService.getReferralsGiven(
          this.selectedUser._id,
          {
            page: this.referralPayload.givenPage,
            limit: this.referralPayload.limit,
          }
        );
        this.referralsGiven =
          response?.data && Array.isArray(response.data.docs)
            ? response.data.docs
            : [];
        this.referralsGivenTotal = response?.data?.totalDocs || 0;
      } else {
        response = await this.referralService.getReferralsReceived(
          this.selectedUser._id,
          {
            page: this.referralPayload.receivedPage,
            limit: this.referralPayload.limit,
          }
        );
        this.referralsReceived =
          response?.data && Array.isArray(response.data.docs)
            ? response.data.docs
            : [];
        this.referralsReceivedTotal = response?.data?.totalDocs || 0;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching referrals:', error);
      swalHelper.showToast('Failed to fetch referrals', 'error');
      this.referralsGiven = [];
      this.referralsReceived = [];
      this.referralsGivenTotal = 0;
      this.referralsReceivedTotal = 0;
    } finally {
      this.referralLoading = false;
      this.cdr.detectChanges();
    }
  }

  onGivenReferralPageChange(page: number): void {
    if (page !== this.referralPayload.givenPage) {
      this.referralPayload.givenPage = page;
      this.fetchReferrals();
    }
  }

  onReceivedReferralPageChange(page: number): void {
    if (page !== this.referralPayload.receivedPage) {
      this.referralPayload.receivedPage = page;
      this.fetchReferrals();
    }
  }

  viewUserDetails(user: ExtendedUser): void {
    this.selectedUser = user;
    this.activeTab = 'profile';
    this.referralTab = 'given';
    this.referralsGiven = [];
    this.referralsReceived = [];
    this.referralsGivenTotal = 0;
    this.referralsReceivedTotal = 0;

    if (this.userDetailsModal) {
      this.userDetailsModal.show();
    } else {
      try {
        const modalElement = document.getElementById('userDetailsModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.userDetailsModal = modalInstance;
          modalInstance.show();
        } else {
          $('#userDetailsModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing modal:', error);
        $('#userDetailsModal').modal('show');
      }
    }
  }

  openNotificationModal(user: any): void {
    this.selectedUser = user;
    this.notificationForm = {
      userId: user._id,
      title: '',
      description: '',
      message: '',
    };
    this.notificationError = {
      title: '',
      description: '',
    };
    if (this.notificationModal) {
      this.notificationModal.show();
    } else {
      try {
        const modalElement = document.getElementById('notificationModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.notificationModal = modalInstance;
          modalInstance.show();
        } else {
          $('#notificationModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing notification modal:', error);
        $('#notificationModal').modal('show');
      }
    }
  }

  closeNotificationModal(): void {
    if (this.notificationModal) {
      this.notificationModal.hide();
    } else {
      $('#notificationModal').modal('hide');
    }
  }

  validateNotificationForm(): boolean {
    let isValid = true;
    this.notificationError = { title: '', description: '' };

    if (!this.notificationForm.title.trim()) {
      this.notificationError.title = 'Title is required';
      isValid = false;
    }
    if (!this.notificationForm.description.trim()) {
      this.notificationError.description = 'Description is required';
      isValid = false;
    }
    return isValid;
  }

  async sendNotification(): Promise<void> {
    if (!this.validateNotificationForm()) {
      return;
    }

    this.notificationLoading = true;
    try {
      const response = await this.authService.sendNotification(
        this.notificationForm
      );
      if (response.success) {
        swalHelper.showToast('Notification sent successfully', 'success');
        this.closeNotificationModal();
      } else {
        swalHelper.showToast(
          response.message || 'Failed to send notification',
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      swalHelper.showToast('Failed to send notification', 'error');
    } finally {
      this.notificationLoading = false;
      this.cdr.detectChanges();
    }
  }

  async editUser(user: ExtendedUser): Promise<void> {
    this.selectedUser = user;
    this.editForm = {
      name: user.name || '',
      mobile_number: user.mobile_number || '',
      email: user.email || '',
      city: user.city || '',
      state: user.state || '',
      country: user.country || '',
      business_name: user.business_name || '',
      business_type: (user as any).business?.[0]?.business_type || '', // Fixed: business_type is nested in business array
      regions: user.regions?.map((region) => region._id) || [],
      dmc_specializations: user.dmc_specializations || [],
    };
    this.editError = {
      name: '',
      mobile_number: '',
      email: '',
      city: '',
      state: '',
      country: '',
      business_name: '',
      business_type: '',
      regions: '',
      dmc_specializations: '',
    };

    // Fetch data based on existing user data
    const regionIds =
      this.editForm.regions && this.editForm.regions.length > 0
        ? this.editForm.regions
        : undefined;

    // Fetch countries based on regions
    await this.fetchCountries(regionIds);

    // If country exists, fetch states
    if (this.editForm.country) {
      await this.fetchStates(this.editForm.country, regionIds);
    }

    // If state exists, fetch cities
    if (this.editForm.state) {
      await this.fetchCities(this.editForm.state, regionIds);
    }

    if (this.editUserModal) {
      this.editUserModal.show();
    } else {
      try {
        const modalElement = document.getElementById('editUserModal');
        if (modalElement) {
          const modalInstance = new bootstrap.Modal(modalElement);
          this.editUserModal = modalInstance;
          modalInstance.show();
        } else {
          $('#editUserModal').modal('show');
        }
      } catch (error) {
        console.error('Error showing edit modal:', error);
        $('#editUserModal').modal('show');
      }
    }
  }

  closeEditModal(): void {
    if (this.editUserModal) {
      this.editUserModal.hide();
    } else {
      $('#editUserModal').modal('hide');
    }
    // Clear dependent dropdowns when modal closes
    this.countries = [];
    this.states = [];
    this.cities = [];
    this.countriesLoaded = false;
    this.statesLoaded = false;
    this.citiesLoaded = false;
  }

  // Cascading dropdown handlers
  onEditRegionsChange(): void {
    // When regions change, fetch countries based on selected regions
    if (this.editForm.regions && this.editForm.regions.length > 0) {
      this.fetchCountries(this.editForm.regions);
      // Clear dependent fields if they don't match
      // Note: We don't clear country/state/city automatically in edit mode
      // to preserve user's existing selection if it's still valid
    } else {
      // If no regions selected, clear countries
      this.countries = [];
      this.countriesLoaded = false;
    }
    this.cdr.detectChanges();
  }

  onEditCountryChange(): void {
    // When country changes, fetch states based on selected country and regions
    if (this.editForm.country) {
      const regionIds =
        this.editForm.regions && this.editForm.regions.length > 0
          ? this.editForm.regions
          : undefined;
      this.fetchStates(this.editForm.country, regionIds);
      // Clear dependent fields
      this.editForm.state = '';
      this.editForm.city = '';
      this.cities = [];
      this.citiesLoaded = false;
    } else {
      // If no country selected, clear states
      this.states = [];
      this.statesLoaded = false;
      this.editForm.state = '';
      this.editForm.city = '';
      this.cities = [];
      this.citiesLoaded = false;
    }
    this.cdr.detectChanges();
  }

  onEditStateChange(): void {
    // When state changes, fetch cities based on selected state and regions
    if (this.editForm.state) {
      const regionIds =
        this.editForm.regions && this.editForm.regions.length > 0
          ? this.editForm.regions
          : undefined;
      this.fetchCities(this.editForm.state, regionIds);
      // Clear dependent field
      this.editForm.city = '';
    } else {
      // If no state selected, clear cities
      this.cities = [];
      this.citiesLoaded = false;
      this.editForm.city = '';
    }
    this.cdr.detectChanges();
  }

  validateEditForm(): boolean {
    let isValid = true;
    this.editError = {
      name: '',
      mobile_number: '',
      email: '',
      city: '',
      state: '',
      country: '',
      business_name: '',
      business_type: '',
      regions: '',
      dmc_specializations: '',
    };

    if (!this.editForm.name.trim()) {
      this.editError.name = 'Name is required';
      isValid = false;
    }
    if (!this.editForm.mobile_number.trim()) {
      this.editError.mobile_number = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(this.editForm.mobile_number)) {
      this.editError.mobile_number = 'Mobile number must be 10 digits';
      isValid = false;
    }
    if (!this.editForm.email.trim()) {
      this.editError.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editForm.email)) {
      this.editError.email = 'Invalid email format';
      isValid = false;
    }
    if (!this.editForm.city.trim()) {
      this.editError.city = 'City is required';
      isValid = false;
    }
    if (!this.editForm.state.trim()) {
      this.editError.state = 'State is required';
      isValid = false;
    }
    if (!this.editForm.country.trim()) {
      this.editError.country = 'Country is required';
      isValid = false;
    }
    if (!this.editForm.business_name.trim()) {
      this.editError.business_name = 'Business name is required';
      isValid = false;
    }
    if (!this.editForm.business_type) {
      this.editError.business_type = 'Business type is required';
      isValid = false;
    } else if (!['B2B', 'B2C', 'Both'].includes(this.editForm.business_type)) {
      this.editError.business_type =
        'Business type must be either B2B , Both or B2C';
      isValid = false;
    }

    return isValid;
  }

  async fetchCountries(regionIds?: string[]): Promise<void> {
    this.countriesLoading = true;
    this.countriesLoaded = false;
    try {
      const requestParams: any = {
        page: 1,
        limit: 1000,
        search: '',
      };

      // If regions are selected, filter countries by those regions
      if (regionIds && regionIds.length > 0) {
        requestParams.regions = regionIds;
      }

      const response = await this.countryService.getAllCountries(requestParams);
      this.countries = response.docs;
      this.countriesLoaded = true;
    } catch (error) {
      console.error('Error fetching countries:', error);
      swalHelper.showToast('Failed to fetch countries', 'error');
    } finally {
      this.countriesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchStates(
    countryNameOrId?: string,
    regionIds?: string[]
  ): Promise<void> {
    this.statesLoading = true;
    this.statesLoaded = false;
    try {
      const requestParams: any = {
        page: 1,
        limit: 1000,
        search: '',
      };

      // If country is selected, filter states by that country
      if (countryNameOrId) {
        requestParams.country = countryNameOrId;
      }

      // If regions are selected, filter states by those regions
      if (regionIds && regionIds.length > 0) {
        requestParams.regions = regionIds;
      }

      const response = await this.stateService.getAllStates(requestParams);
      this.states = response.docs;
      this.statesLoaded = true;
    } catch (error) {
      console.error('Error fetching states:', error);
      swalHelper.showToast('Failed to fetch states', 'error');
    } finally {
      this.statesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async fetchDmcLists(): Promise<void> {
    this.dmcLoading = true;
    try {
      const response = await this.dmcListService.getAllDmcLists();
      this.specializations = Array.isArray(response) ? response : [];

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching DMC lists:', error);
    } finally {
      this.dmcLoading = false;
    }
  }

  async fetchCities(
    stateNameOrId?: string,
    regionIds?: string[]
  ): Promise<void> {
    this.citiesLoading = true;
    this.citiesLoaded = false;
    try {
      const requestParams: any = {
        page: 1,
        limit: 1000,
        search: '',
      };

      // If state is selected, filter cities by that state
      if (stateNameOrId) {
        requestParams.state = stateNameOrId;
      }

      // If regions are selected, filter cities by those regions
      if (regionIds && regionIds.length > 0) {
        requestParams.regions = regionIds;
      }

      const response = await this.cityService.getAllCities(requestParams);
      this.cities = response.docs;
      this.citiesLoaded = true;
    } catch (error) {
      console.error('Error fetching cities:', error);
      swalHelper.showToast('Failed to fetch cities', 'error');
    } finally {
      this.citiesLoading = false;
      this.cdr.detectChanges();
    }
  }

  async updateUser(): Promise<void> {
    if (!this.validateEditForm()) {
      return;
    }

    this.editLoading = true;
    try {
      const response = await this.authService.updateNewUser(
        this.selectedUser!._id,
        {
          ...this.editForm,
          business: [
            {
              business_name: this.editForm.business_name,
              business_type: this.editForm.business_type,
              primary_business: true,
            },
          ],
        }
      );
      if (response.success) {
        swalHelper.showToast('User updated successfully', 'success');
        this.closeEditModal();
        this.fetchUsers();
      } else {
        swalHelper.showToast(
          response.message || 'Failed to update user',
          'error'
        );
      }
    } catch (error) {
      console.error('Error updating user:', error);
      swalHelper.showToast('Failed to update user', 'error');
    } finally {
      this.editLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeModal(): void {
    if (this.userDetailsModal) {
      this.userDetailsModal.hide();
    } else {
      $('#userDetailsModal').modal('hide');
    }
  }

  async toggleUserStatus(user: any): Promise<void> {
    // Store original state in case we need to revert
    const originalState = user.isActive;

    // Optimistically update UI
    user.isActive = !user.isActive;
    user._toggling = true; // Flag to show this specific toggle is processing

    try {
      const response = await this.authService.toggleUserStatus({
        id: user._id,
      });
      if (response && response.success) {
        user.isActive = response.data;
        swalHelper.showToast(
          `User status changed to ${response.data ? 'Active' : 'Inactive'}`,
          'success'
        );
      } else {
        // Revert on error
        user.isActive = originalState;
        const errorMessage =
          response?.message || 'Failed to update user status';
        console.error('Toggle user status failed:', errorMessage);
        swalHelper.showToast(errorMessage, 'error');
      }
    } catch (error) {
      // Revert on error
      user.isActive = originalState;
      console.error('Error updating user status:', error);
      swalHelper.showToast('Failed to update user status', 'error');
    } finally {
      user._toggling = false;
      this.cdr.detectChanges();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const result = await swalHelper.confirmation(
        'Delete User',
        'Are you sure you want to delete this user? This action cannot be undone.',
        'warning'
      );

      if (result.isConfirmed) {
        this.loading = true;
        const response = await this.authService.deleteUser(userId);
        if (response.success) {
          swalHelper.showToast('User deleted successfully', 'success');
          this.fetchUsers();
        } else {
          swalHelper.showToast(
            response.message || 'Failed to delete user',
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      swalHelper.showToast('Failed to delete user', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async exportToExcel(): Promise<void> {
    this.exporting = true;
    try {
      // Fetch ALL users by fetching all pages
      let allUsers: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100; // Fetch 100 at a time

      while (hasMore) {
        const response = await this.authService.getUsers({
          search: this.payload.search || '',
          page: currentPage,
          limit: pageSize,
          chapter: this.payload.chapter,
        });

        if (response && response.docs && response.docs.length > 0) {
          allUsers = allUsers.concat(response.docs);
          hasMore =
            response.docs.length === pageSize &&
            currentPage < response.totalPages;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      if (allUsers.length === 0) {
        swalHelper.showToast('No data to export', 'warning');
        return;
      }

      // Prepare data for export
      const exportData = allUsers.map((user: any, index: number) => ({
        'Sr. No.': index + 1,
        Name: user.name || 'N/A',
        Email: user.email || 'N/A',
        'Mobile Number': user.mobile_number || 'N/A',
        'Business Name': user.business_name || 'N/A',
        'Business Type': user.business?.[0]?.business_type || 'N/A',
        City: user.city || 'N/A',
        State: user.state || 'N/A',
        Country: user.country || 'N/A',
        'DMC Specializations': user.dmc_specializations?.join(', ') || 'N/A',
        Regions: user.regions?.map((r: any) => r.name).join(', ') || 'N/A',
        Status: user.isActive !== false ? 'Active' : 'Inactive',
        Member: user.isMember ? 'Yes' : 'No',
        'Created At': user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : 'N/A',
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Members');

      // Set column widths
      const columnWidths = [
        { wch: 8 }, // Sr. No.
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Mobile Number
        { wch: 30 }, // Business Name
        { wch: 12 }, // Business Type
        { wch: 15 }, // City
        { wch: 15 }, // State
        { wch: 15 }, // Country
        { wch: 30 }, // DMC Specializations
        { wch: 30 }, // Services Offered
        { wch: 30 }, // Regions
        { wch: 10 }, // Status
        { wch: 10 }, // Member
        { wch: 15 }, // Created At
      ];
      worksheet['!cols'] = columnWidths;

      // Generate filename with current date
      const fileName = `All_Members_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;

      // Write file
      XLSX.writeFile(workbook, fileName);

      swalHelper.showToast(
        `Excel file exported successfully with ${allUsers.length} records`,
        'success'
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      swalHelper.showToast('Failed to export to Excel', 'error');
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  async exportToCSV(): Promise<void> {
    this.exporting = true;
    try {
      // Fetch ALL users by fetching all pages
      let allUsers: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 100; // Fetch 100 at a time

      while (hasMore) {
        const response = await this.authService.getUsers({
          search: this.payload.search || '',
          page: currentPage,
          limit: pageSize,
          chapter: this.payload.chapter,
        });

        if (response && response.docs && response.docs.length > 0) {
          allUsers = allUsers.concat(response.docs);
          hasMore =
            response.docs.length === pageSize &&
            currentPage < response.totalPages;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      if (allUsers.length === 0) {
        swalHelper.showToast('No data to export', 'warning');
        return;
      }

      // Prepare data for export
      const exportData = allUsers.map((user: any, index: number) => ({
        'Sr. No.': index + 1,
        Name: user.name || 'N/A',
        Email: user.email || 'N/A',
        'Mobile Number': user.mobile_number || 'N/A',
        'Business Name': user.business_name || 'N/A',
        'Business Type': user.business?.[0]?.business_type || 'N/A',
        City: user.city || 'N/A',
        State: user.state || 'N/A',
        Country: user.country || 'N/A',
        'DMC Specializations': user.dmc_specializations?.join(', ') || 'N/A',
        Regions: user.regions?.map((r: any) => r.name).join(', ') || 'N/A',
        Status: user.isActive !== false ? 'Active' : 'Inactive',
        Member: user.isMember ? 'Yes' : 'No',
        'Created At': user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : 'N/A',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Convert to CSV
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Generate filename with current date
      const fileName = `All_Members_${
        new Date().toISOString().split('T')[0]
      }.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      swalHelper.showToast(
        `CSV file exported successfully with ${allUsers.length} records`,
        'success'
      );
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      swalHelper.showToast('Failed to export to CSV', 'error');
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}
