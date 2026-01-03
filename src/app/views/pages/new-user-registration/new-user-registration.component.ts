import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';
import {
  DmcListService,
  RegisterUserAuthService,
  User,
} from '../../../services/auth.service';
import { CountryService, Country } from '../../../services/auth.service';
import { StateService, State } from '../../../services/auth.service';
import { CityService, City } from '../../../services/auth.service';
import { RegionService } from '../../../services/auth.service';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import Swal from 'sweetalert2';
import { debounceTime, Subject } from 'rxjs';

declare var $: any;
declare var bootstrap: any;

// Interface for Registration data
interface Registration {
  _id: string;
  name: string;
  email: string;
  mobile_number: string;
  country: string;
  state: string;
  city: string;
  business_name: string;
  business_type: string; // Added business_type
  isMember: boolean;
  regions: RegionObject[];
  business?: {
    business_name: string;
    business_type: string;
    primary_business: boolean;
  }[];
  dmc_specializations: string[];
  createdAt: string;
  updatedAt?: string;
}

// Interface for Region Object in response
interface RegionObject {
  _id: string;
  name: string;
  description: string;
  countries: string[];
}

// Interface for API Response Data
interface RegistrationData {
  docs: Registration[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pagingCounter: number;
  prevPage: number | null;
  nextPage: number | null;
}

// Interface for API Response
interface RegistrationResponse {
  success: boolean;
  message: string;
  data: RegistrationData;
  status: number;
}

// Interface for Region
interface Region {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-new-user-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, NgxPaginationModule],
  providers: [
    RegisterUserAuthService,
    CountryService,
    StateService,
    CityService,
    RegionService,
    AuthService,
    DashboardService,
    DmcListService,
  ],
  templateUrl: './new-user-registration.component.html',
  styleUrls: ['./new-user-registration.component.css'],
})
export class NewUserRegistrationComponent implements OnInit, AfterViewInit {
  registerForm: any = {
    name: '',
    email: '',
    mobile_number: '',
    city: '',
    state: '',
    country: '',
    business_name: '',
    business_type: '', // Added business_type
    regions: [],
    dmc_specializations: [],
  };

  countries: Country[] = [];
  states: State[] = [];
  cities: City[] = [];
  regions: Region[] = [];

  // Predefined business types
  businessTypes: string[] = ['B2B', 'B2C', 'Both'];

  // Predefined specializations array
  specializations: any[] = [];

  registrations: RegistrationData = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    pagingCounter: 1,
    prevPage: null,
    nextPage: null,
  };

  loading: boolean = false;
  countriesLoading: boolean = false;
  statesLoading: boolean = false;
  citiesLoading: boolean = false;
  dmcLoading: boolean = false;
  regionsLoading: boolean = false;
  registrationsLoading: boolean = false;
  acceptingUser: string = '';

  countriesLoaded: boolean = false;
  statesLoaded: boolean = false;
  citiesLoaded: boolean = false;
  regionsLoaded: boolean = false;

  // Search and pagination
  searchQuery: string = '';
  payload = {
    search: '',
    page: 1,
    limit: 10,
  };

  paginationConfig = {
    id: 'registrations-pagination',
  };

  // Track which fields have been touched/interacted with
  touchedFields: any = {
    name: false,
    email: false,
    mobile_number: false,
    country: false,
    state: false,
    city: false,
    business_name: false,
    business_type: false, // Added business_type
    regions: false,
    dmc_specializations: false,
  };

  // Validation error messages
  validationErrors: any = {
    name: '',
    email: '',
    mobile_number: '',
    country: '',
    state: '',
    city: '',
    business_name: '',
    business_type: '', // Added business_type
    regions: '',
    dmc_specializations: '',
  };

  Math = Math;
  private searchSubject = new Subject<string>();
  registerModal: any;
  userDetailsModal: any;
  selectedUserDetails: Registration | null = null;
  importingExcel: boolean = false;
  previewModal: any;
  excelPreviewData: any = null;
  columnMapping: any = {};
  availableFields: any[] = [];
  excelColumns: string[] = [];
  filePath: string = '';
  previewLoading: boolean = false;

  constructor(
    private registerService: RegisterUserAuthService,
    private countryService: CountryService,
    private dmcListService: DmcListService,
    private stateService: StateService,
    private cityService: CityService,
    private regionService: RegionService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.fetchRegistrations();
    });
  }

  ngOnInit(): void {
    // Only fetch regions initially - countries, states, cities will be fetched based on selections
    this.fetchRegions();
    this.fetchRegistrations();
    this.fetchDmcLists();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const modalElement = document.getElementById('registerModal');
      if (modalElement) {
        this.registerModal = new bootstrap.Modal(modalElement);
      }
      const userDetailsModalElement =
        document.getElementById('userDetailsModal');
      if (userDetailsModalElement) {
        this.userDetailsModal = new bootstrap.Modal(userDetailsModalElement);
      }
      const previewModalElement = document.getElementById('excelPreviewModal');
      if (previewModalElement) {
        this.previewModal = new bootstrap.Modal(previewModalElement);
      }
    }, 300);
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

  async fetchRegions(): Promise<void> {
    this.regionsLoading = true;
    this.regionsLoaded = false;
    try {
      const response = await this.regionService.getRegions({
        page: 1,
        limit: 1000,
        search: '',
      });
      this.regions = response.docs;
      this.regionsLoaded = true;
    } catch (error) {
      console.error('Error fetching regions:', error);
      swalHelper.showToast('Failed to fetch regions', 'error');
    } finally {
      this.regionsLoading = false;
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

  async fetchRegistrations(): Promise<void> {
    this.registrationsLoading = true;
    try {
      const requestData = {
        page: this.payload.page,
        limit: this.payload.limit,
        search: this.payload.search,
      };
      const response: RegistrationResponse =
        await this.registerService.getAllMembers(requestData);

      if (response && response.success && response.data) {
        this.registrations = response.data;
        this.cdr.detectChanges();

        // Reinitialize tooltips after data loads
        this.initializeTooltips();
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      swalHelper.showToast('Failed to fetch registrations', 'error');
      this.registrations = {
        docs: [],
        totalDocs: 0,
        limit: this.payload.limit,
        page: this.payload.page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        pagingCounter: 1,
        prevPage: null,
        nextPage: null,
      };
    } finally {
      this.registrationsLoading = false;
      this.cdr.detectChanges();
    }
  }

  onSearch(): void {
    this.payload.page = 1;
    this.payload.search = this.searchQuery;
    this.searchSubject.next(this.searchQuery);
  }

  onChange(): void {
    this.payload.page = 1;
    this.fetchRegistrations();
  }

  onPageChange(page: number): void {
    if (page !== this.payload.page) {
      this.payload.page = page;
      this.fetchRegistrations();
    }
  }

  async acceptUser(registration: Registration): Promise<void> {
    try {
      this.acceptingUser = registration._id;

      const result = await swalHelper.confirmation(
        'Accept User',
        `Are you sure you want to accept ${registration.name} as a member?`,
        'question'
      );

      if (result.isConfirmed) {
        const response = await this.registerService.addToMember({
          id: registration._id,
        });

        if (response && response.success) {
          swalHelper.showToast('User accepted successfully', 'success');
          this.fetchRegistrations();
        } else {
          swalHelper.showToast(
            response.message || 'Failed to accept user',
            'error'
          );
        }
      }
    } catch (error) {
      console.error('Error accepting user:', error);
      swalHelper.showToast('Failed to accept user', 'error');
    } finally {
      this.acceptingUser = '';
      this.cdr.detectChanges();
    }
  }

  onMobileInput(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    this.registerForm.mobile_number = value;
    input.value = value;

    this.touchedFields.mobile_number = true;
    if (value.length === 10) {
      this.validationErrors.mobile_number = '';
    } else if (value.length > 0) {
      this.validateMobileNumber();
    }
  }

  validateName(): boolean {
    if (!this.touchedFields.name) {
      return true;
    }

    const name = this.registerForm.name.trim();
    if (!name) {
      this.validationErrors.name = 'Full name is required';
      return false;
    }
    if (name.length < 2) {
      this.validationErrors.name = 'Full name must be at least 2 characters';
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.validationErrors.name =
        'Full name can only contain letters and spaces';
      return false;
    }
    this.validationErrors.name = '';
    return true;
  }

  validateEmail(): boolean {
    if (!this.touchedFields.email) {
      return true;
    }

    const email = this.registerForm.email.trim();
    if (!email) {
      this.validationErrors.email = 'Email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      return false;
    }
    this.validationErrors.email = '';
    return true;
  }

  validateMobileNumber(): boolean {
    if (!this.touchedFields.mobile_number) {
      return true;
    }

    const mobile = this.registerForm.mobile_number;
    if (!mobile) {
      this.validationErrors.mobile_number = 'Mobile number is required';
      return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
      this.validationErrors.mobile_number =
        'Mobile number must be exactly 10 digits';
      return false;
    }
    this.validationErrors.mobile_number = '';
    return true;
  }

  validateCountry(): boolean {
    if (!this.touchedFields.country) {
      return true;
    }

    if (!this.registerForm.country) {
      this.validationErrors.country = 'Country is required';
      return false;
    }
    this.validationErrors.country = '';
    return true;
  }

  validateState(): boolean {
    if (!this.touchedFields.state) {
      return true;
    }

    if (!this.registerForm.state) {
      this.validationErrors.state = 'State is required';
      return false;
    }
    this.validationErrors.state = '';
    return true;
  }

  validateCity(): boolean {
    if (!this.touchedFields.city) {
      return true;
    }

    if (!this.registerForm.city) {
      this.validationErrors.city = 'City is required';
      return false;
    }
    this.validationErrors.city = '';
    return true;
  }

  validateBusinessName(): boolean {
    if (!this.touchedFields.business_name) {
      return true;
    }

    const businessName = this.registerForm.business_name.trim();
    if (!businessName) {
      this.validationErrors.business_name = 'Business name is required';
      return false;
    }
    if (businessName.length < 2) {
      this.validationErrors.business_name =
        'Business name must be at least 2 characters';
      return false;
    }
    this.validationErrors.business_name = '';
    return true;
  }

  validateBusinessType(): boolean {
    if (!this.touchedFields.business_type) {
      return true;
    }

    if (!this.registerForm.business_type) {
      this.validationErrors.business_type = 'Business type is required';
      return false;
    }
    if (!['B2B', 'B2C', 'Both'].includes(this.registerForm.business_type)) {
      this.validationErrors.business_type =
        'Business type must be either B2B or B2C';
      return false;
    }
    this.validationErrors.business_type = '';
    return true;
  }

  validateRegions(): boolean {
    if (!this.touchedFields.regions) {
      return true;
    }

    if (!this.registerForm.regions || this.registerForm.regions.length === 0) {
      this.validationErrors.regions = 'At least one region is required';
      return false;
    }
    this.validationErrors.regions = '';
    return true;
  }

  validateSpecializations(): boolean {
    if (!this.touchedFields.dmc_specializations) {
      return true;
    }

    if (
      !this.registerForm.dmc_specializations ||
      this.registerForm.dmc_specializations.length === 0
    ) {
      this.validationErrors.dmc_specializations =
        'At least one specialization is required';
      return false;
    }
    this.validationErrors.dmc_specializations = '';
    return true;
  }

  onFieldBlur(fieldName: string): void {
    this.touchedFields[fieldName] = true;

    switch (fieldName) {
      case 'name':
        this.validateName();
        break;
      case 'email':
        this.validateEmail();
        break;
      case 'mobile_number':
        this.validateMobileNumber();
        break;
      case 'country':
        this.validateCountry();
        break;
      case 'state':
        this.validateState();
        break;
      case 'city':
        this.validateCity();
        break;
      case 'business_name':
        this.validateBusinessName();
        break;
      case 'business_type':
        this.validateBusinessType();
        break;
      case 'regions':
        this.validateRegions();
        break;
      case 'dmc_specializations':
        this.validateSpecializations();
        break;
    }
  }

  // Cascading dropdown handlers
  onRegionsChange(): void {
    // When regions change, fetch countries based on selected regions
    if (this.registerForm.regions && this.registerForm.regions.length > 0) {
      this.fetchCountries(this.registerForm.regions);
      // Clear dependent fields
      this.registerForm.country = '';
      this.registerForm.state = '';
      this.registerForm.city = '';
      this.states = [];
      this.cities = [];
      this.statesLoaded = false;
      this.citiesLoaded = false;
    } else {
      // If no regions selected, clear countries
      this.countries = [];
      this.countriesLoaded = false;
      this.registerForm.country = '';
      this.registerForm.state = '';
      this.registerForm.city = '';
      this.states = [];
      this.cities = [];
      this.statesLoaded = false;
      this.citiesLoaded = false;
    }
    this.cdr.detectChanges();
  }

  onCountryChange(): void {
    // When country changes, fetch states based on selected country and regions
    if (this.registerForm.country) {
      const regionIds =
        this.registerForm.regions && this.registerForm.regions.length > 0
          ? this.registerForm.regions
          : undefined;
      this.fetchStates(this.registerForm.country, regionIds);
      // Clear dependent fields
      this.registerForm.state = '';
      this.registerForm.city = '';
      this.cities = [];
      this.citiesLoaded = false;
    } else {
      // If no country selected, clear states
      this.states = [];
      this.statesLoaded = false;
      this.registerForm.state = '';
      this.registerForm.city = '';
      this.cities = [];
      this.citiesLoaded = false;
    }
    this.cdr.detectChanges();
  }

  onStateChange(): void {
    // When state changes, fetch cities based on selected state and regions
    if (this.registerForm.state) {
      const regionIds =
        this.registerForm.regions && this.registerForm.regions.length > 0
          ? this.registerForm.regions
          : undefined;
      this.fetchCities(this.registerForm.state, regionIds);
      // Clear dependent field
      this.registerForm.city = '';
    } else {
      // If no state selected, clear cities
      this.cities = [];
      this.citiesLoaded = false;
      this.registerForm.city = '';
    }
    this.cdr.detectChanges();
  }

  async registerUser(): Promise<void> {
    try {
      this.markAllRequiredFieldsAsTouched();

      if (!this.validateFormForSubmission()) {
        swalHelper.showToast('Please fix all validation errors', 'warning');
        return;
      }

      this.loading = true;

      // Create request body object
      const requestBody: any = {
        name: this.registerForm.name,
        email: this.registerForm.email,
        mobile_number: this.registerForm.mobile_number,
        city: this.registerForm.city,
        state: this.registerForm.state,
        country: this.registerForm.country,
        business_name: this.registerForm.business_name,
        regions: this.registerForm.regions,
        dmc_specializations: this.registerForm.dmc_specializations,
        business: [
          {
            business_name: this.registerForm.business_name,
            business_type: this.registerForm.business_type,
            primary_business: true,
          },
        ],
      };

      console.log('Request body:', requestBody);

      const response = await this.registerService.newRegisterUser(requestBody);
      console.log('Register response:', response);

      if (response && response.success) {
        swalHelper.showToast('User registered successfully', 'success');
        this.closeModal();
        this.resetForm();
        this.fetchRegistrations();
      } else {
        swalHelper.showToast(
          response.message || 'Failed to register user',
          'error'
        );
      }
    } catch (error) {
      console.error('Error registering user:', error);
      swalHelper.showToast('Failed to register user', 'error');
    } finally {
      this.loading = false;
    }
  }

  markAllRequiredFieldsAsTouched(): void {
    this.touchedFields.name = true;
    this.touchedFields.email = true;
    this.touchedFields.mobile_number = true;
    this.touchedFields.country = true;
    this.touchedFields.state = true;
    this.touchedFields.city = true;
    this.touchedFields.business_name = true;
    this.touchedFields.business_type = true;
    this.touchedFields.regions = true;
    this.touchedFields.dmc_specializations = true;
  }

  validateFormForSubmission(): boolean {
    const name = this.registerForm.name.trim();
    const email = this.registerForm.email.trim();
    const mobile = this.registerForm.mobile_number;
    const businessName = this.registerForm.business_name.trim();
    const businessType = this.registerForm.business_type;

    let isValid = true;

    if (!name) {
      this.validationErrors.name = 'Full name is required';
      isValid = false;
    } else if (name.length < 2) {
      this.validationErrors.name = 'Full name must be at least 2 characters';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.validationErrors.name =
        'Full name can only contain letters and spaces';
      isValid = false;
    } else {
      this.validationErrors.name = '';
    }

    if (!email) {
      this.validationErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      isValid = false;
    } else {
      this.validationErrors.email = '';
    }

    if (!mobile) {
      this.validationErrors.mobile_number = 'Mobile number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(mobile)) {
      this.validationErrors.mobile_number =
        'Mobile number must be exactly 10 digits';
      isValid = false;
    } else {
      this.validationErrors.mobile_number = '';
    }

    if (!this.registerForm.country) {
      this.validationErrors.country = 'Country is required';
      isValid = false;
    } else {
      this.validationErrors.country = '';
    }

    if (!this.registerForm.state) {
      this.validationErrors.state = 'State is required';
      isValid = false;
    } else {
      this.validationErrors.state = '';
    }

    if (!this.registerForm.city) {
      this.validationErrors.city = 'City is required';
      isValid = false;
    } else {
      this.validationErrors.city = '';
    }

    if (!businessName) {
      this.validationErrors.business_name = 'Business name is required';
      isValid = false;
    } else if (businessName.length < 2) {
      this.validationErrors.business_name =
        'Business name must be at least 2 characters';
      isValid = false;
    } else {
      this.validationErrors.business_name = '';
    }

    if (!businessType) {
      this.validationErrors.business_type = 'Business type is required';
      isValid = false;
    } else if (!['B2B', 'B2C', 'Both'].includes(businessType)) {
      this.validationErrors.business_type =
        'Business type must be either B2B or B2C';
      isValid = false;
    } else {
      this.validationErrors.business_type = '';
    }

    if (!this.registerForm.regions || this.registerForm.regions.length === 0) {
      this.validationErrors.regions = 'At least one region is required';
      isValid = false;
    } else {
      this.validationErrors.regions = '';
    }

    if (
      !this.registerForm.dmc_specializations ||
      this.registerForm.dmc_specializations.length === 0
    ) {
      this.validationErrors.dmc_specializations =
        'At least one specialization is required';
      isValid = false;
    } else {
      this.validationErrors.dmc_specializations = '';
    }
    return isValid;
  }

  validateForm(): boolean {
    const name = this.registerForm.name.trim();
    const email = this.registerForm.email.trim();
    const mobile = this.registerForm.mobile_number;
    const businessName = this.registerForm.business_name.trim();
    const businessType = this.registerForm.business_type;

    return (
      name &&
      name.length >= 2 &&
      /^[a-zA-Z\s]+$/.test(name) &&
      email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      mobile &&
      /^\d{10}$/.test(mobile) &&
      this.registerForm.country &&
      this.registerForm.state &&
      this.registerForm.city &&
      businessName &&
      businessName.length >= 2 &&
      businessType &&
      ['B2B', 'B2C', 'Both'].includes(businessType) &&
      this.registerForm.regions &&
      this.registerForm.regions.length > 0 &&
      this.registerForm.dmc_specializations &&
      this.registerForm.dmc_specializations.length > 0
    );
  }

  resetForm(): void {
    this.registerForm = {
      name: '',
      email: '',
      mobile_number: '',
      city: '',
      state: '',
      country: '',
      business_name: '',
      business_type: '',
      regions: [],
      dmc_specializations: [],
    };

    this.validationErrors = {
      name: '',
      email: '',
      mobile_number: '',
      country: '',
      state: '',
      city: '',
      business_name: '',
      business_type: '',
      regions: '',
      dmc_specializations: '',
    };

    this.touchedFields = {
      name: false,
      email: false,
      mobile_number: false,
      country: false,
      state: false,
      city: false,
      business_name: false,
      business_type: false,
      regions: false,
      dmc_specializations: false,
    };

    // Clear dependent dropdowns
    this.countries = [];
    this.states = [];
    this.cities = [];
    this.countriesLoaded = false;
    this.statesLoaded = false;
    this.citiesLoaded = false;
  }

  showModal(): void {
    this.cdr.detectChanges();
    if (this.registerModal) {
      this.registerModal.show();
    } else {
      $('#registerModal').modal('show');
    }
  }

  closeModal(): void {
    if (this.registerModal) {
      this.registerModal.hide();
    } else {
      $('#registerModal').modal('hide');
    }
  }

  openRegisterModal(): void {
    this.resetForm();
    setTimeout(() => {
      this.showModal();
    }, 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  getArrayDisplay(arr: string[]): string {
    if (!arr || arr.length === 0) return 'N/A';
    return arr.join(', ');
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

  openUserDetailsModal(registration: Registration): void {
    this.selectedUserDetails = registration;
    this.cdr.detectChanges();
    if (this.userDetailsModal) {
      this.userDetailsModal.show();
    } else {
      const modalElement = document.getElementById('userDetailsModal');
      if (modalElement) {
        this.userDetailsModal = new bootstrap.Modal(modalElement);
        this.userDetailsModal.show();
      }
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['xls', 'xlsx', 'xlsm', 'csv'];

    if (!allowedExtensions.includes(fileExtension || '')) {
      swalHelper.showToast(
        'Invalid file type. Please upload an Excel (.xls, .xlsx, .xlsm) or CSV (.csv) file.',
        'error'
      );
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      swalHelper.showToast(
        'File size exceeds 10MB. Please upload a smaller file.',
        'error'
      );
      event.target.value = '';
      return;
    }

    // Preview Excel file
    await this.previewExcelFile(file, event);
  }

  async previewExcelFile(file: File, event: any): Promise<void> {
    this.previewLoading = true;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.authService.previewExcelFile(formData);
      if (response.success) {
        this.excelPreviewData = response.data;
        this.excelColumns = response.data.excelColumns || [];
        this.availableFields = response.data.availableFields || [];
        this.filePath = response.data.filePath;

        // Initialize column mapping - try to auto-map by matching column names
        this.initializeColumnMapping();

        // Open preview modal
        if (this.previewModal) {
          this.previewModal.show();
        }
      } else {
        swalHelper.showToast(
          response.message || 'Failed to preview Excel file',
          'error'
        );
        event.target.value = '';
      }
    } catch (error: any) {
      console.error('Error previewing Excel:', error);
      swalHelper.showToast(
        'Error previewing Excel file: ' + (error.message || 'Unknown error'),
        'error'
      );
      event.target.value = '';
    } finally {
      this.previewLoading = false;
      this.cdr.detectChanges();
    }
  }

  initializeColumnMapping(): void {
    this.columnMapping = {};

    // Auto-map columns by matching names (case-insensitive)
    const fieldMap: { [key: string]: string[] } = {
      name: ['name', 'first_name', 'full_name', 'user_name'],
      email: ['email', 'email_id', 'e_mail'],
      mobile_number: [
        'mobile_number',
        'mobile',
        'phone',
        'phone_number',
        'contact',
      ],
      business_name: ['business_name', 'company_name', 'company', 'business'],
      city: ['city'],
      state: ['state'],
      country: ['country'],
      address: ['address', 'registered_office_address'],
      business_type: ['business_type', 'registered_as'],
      regions: ['regions', 'region'],
      dmc_specializations: ['dmc_specializations', 'dmc_specialization'],
      isActive: ['isActive', 'is_active', 'active'],
      isMember: ['isMember', 'is_member', 'member'],
    };

    this.availableFields.forEach((field: any) => {
      const possibleNames = fieldMap[field.key] || [field.key.toLowerCase()];
      const matchedColumn = this.excelColumns.find((col) =>
        possibleNames.some(
          (name) =>
            col.toLowerCase().replace(/[_\s]/g, '') ===
            name.toLowerCase().replace(/[_\s]/g, '')
        )
      );
      if (matchedColumn) {
        this.columnMapping[field.key] = matchedColumn;
      }
    });
  }

  async importWithMapping(): Promise<void> {
    // Validate required fields
    const requiredFields = this.availableFields.filter((f: any) => f.required);
    const missingFields = requiredFields.filter(
      (f: any) => !this.columnMapping[f.key]
    );

    if (missingFields.length > 0) {
      swalHelper.showToast(
        `Please map required fields: ${missingFields
          .map((f: any) => f.label)
          .join(', ')}`,
        'error'
      );
      return;
    }

    const confirmationResult = await swalHelper.takeConfirmation(
      'Import Users from Excel',
      `Are you sure you want to import ${this.excelPreviewData.totalRows} users?`,
      'Yes, Import!'
    );

    if (!confirmationResult.isConfirmed) {
      return;
    }

    this.importingExcel = true;

    try {
      const response = await this.authService.importUserRegistrationsFromExcel(
        this.columnMapping,
        this.filePath
      );

      if (response.success) {
        const data = response.data;

        // Show success toast
        swalHelper.showToast(
          `Successfully imported ${data.created} users out of ${data.total} total rows.`,
          'success'
        );

        // Show detailed breakdown if rows were skipped
        if (data.skipped > 0) {
          let detailsHtml = `
            <div style="text-align: left; margin-top: 15px;">
              <h4 style="margin-bottom: 15px; color: #333;">Import Summary</h4>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 5px 0;"><strong>Total Rows:</strong> ${data.total}</p>
                <p style="margin: 5px 0; color: #28a745;"><strong>✓ Created:</strong> ${data.created}</p>
                <p style="margin: 5px 0; color: #ffc107;"><strong>⚠ Skipped:</strong> ${data.skipped}</p>
              </div>
          `;

          if (data.skippedDetails) {
            detailsHtml += `
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h5 style="margin-bottom: 10px; color: #856404;">Skipped Details:</h5>
                <p style="margin: 5px 0;">• <strong>Duplicates:</strong> ${
                  data.skippedDetails.duplicates
                } rows (already exist in database)</p>
                <p style="margin: 5px 0;">• <strong>Missing Fields:</strong> ${
                  data.skippedDetails.missingFields
                } rows (missing name, email, or mobile)</p>
                ${
                  data.skippedDetails.other > 0
                    ? `<p style="margin: 5px 0;">• <strong>Other Errors:</strong> ${data.skippedDetails.other} rows</p>`
                    : ''
                }
              </div>
            `;
          }

          // Add sample skipped rows
          if (data.skippedRows && data.skippedRows.length > 0) {
            const sampleRows = data.skippedRows.slice(0, 10);
            detailsHtml += `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;">
                <h5 style="margin-bottom: 10px;">Sample Skipped Rows (showing first 10):</h5>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background: #e9ecef;">
                      <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Row #</th>
                      <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Reason</th>
                      <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">Details</th>
                    </tr>
                  </thead>
                  <tbody>
            `;

            sampleRows.forEach((skipped: any) => {
              let details = '';
              if (skipped.reason === 'Duplicate user') {
                details = `Email: ${skipped.email || 'N/A'}, Mobile: ${
                  skipped.mobile_number || 'N/A'
                }`;
              } else if (skipped.reason === 'Missing required fields') {
                details = `Missing: ${
                  skipped.missingFields?.join(', ') || 'N/A'
                }`;
              } else {
                details = skipped.error || 'N/A';
              }

              detailsHtml += `
                <tr>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${skipped.row}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${skipped.reason}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6; font-size: 11px;">${details}</td>
                </tr>
              `;
            });

            detailsHtml += `
                  </tbody>
                </table>
                ${
                  data.skippedRows.length > 10
                    ? `<p style="margin-top: 10px; font-size: 11px; color: #6c757d;">... and ${
                        data.skippedRows.length - 10
                      } more. Check console for full details.</p>`
                    : ''
                }
              </div>
            `;
          }

          detailsHtml += `</div>`;

          // Show detailed modal
          Swal.fire({
            icon: 'info',
            title: 'Import Complete',
            html: detailsHtml,
            width: '700px',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6',
          });
        }

        // Log full details to console for debugging
        if (data.skippedRows && data.skippedRows.length > 0) {
          console.group('📊 Import Summary - Skipped Rows');
          console.log('Total Skipped:', data.skipped);
          if (data.skippedDetails) {
            console.log('Duplicates:', data.skippedDetails.duplicates);
            console.log('Missing Fields:', data.skippedDetails.missingFields);
            console.log('Other Errors:', data.skippedDetails.other);
          }
          console.log('All Skipped Rows:', data.skippedRows);
          console.groupEnd();
        }

        // Log errors if any
        if (data.errors && data.errors.length > 0) {
          console.group('❌ Import Errors');
          console.error('Errors:', data.errors);
          console.groupEnd();
        }

        this.fetchRegistrations();
        this.closePreviewModal();
      } else {
        swalHelper.showToast(
          response.message || 'Failed to import users.',
          'error'
        );
      }
    } catch (error: any) {
      console.error('Error importing Excel:', error);
      swalHelper.showToast(
        'Error importing Excel file: ' + (error.message || 'Unknown error'),
        'error'
      );
    } finally {
      this.importingExcel = false;
      this.cdr.detectChanges();
    }
  }

  closePreviewModal(): void {
    if (this.previewModal) {
      this.previewModal.hide();
    }
    this.excelPreviewData = null;
    this.columnMapping = {};
    this.filePath = '';
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getSampleValue(columnName: string): string {
    if (
      !this.excelPreviewData ||
      !this.excelPreviewData.previewData ||
      this.excelPreviewData.previewData.length === 0
    ) {
      return '(empty)';
    }
    const value = this.excelPreviewData.previewData[0][columnName];
    return value !== undefined && value !== null && value !== ''
      ? String(value)
      : '(empty)';
  }

  isColumnMapped(columnName: string): boolean {
    return Object.values(this.columnMapping).includes(columnName);
  }
}
