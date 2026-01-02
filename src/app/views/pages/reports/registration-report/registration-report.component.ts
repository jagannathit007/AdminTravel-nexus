import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../services/auth.service';
import { swalHelper } from '../../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { environment } from 'src/env/env.local';

@Component({
    selector: 'app-registration-report',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
    providers: [EventService],
    templateUrl: './registration-report.component.html',
    styleUrls: ['./registration-report.component.css']
})
export class RegistrationReportComponent implements OnInit {
    events: any[] = [];
    selectedEventId: string = '';
    registrations: any = null;
    loading: boolean = false;
    page: number = 1;
    limit: number = 10;
    searchQuery: string = '';
    selectedStatus: string = '';
    selectedType: string = '';

    statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' }
    ];

    typeOptions = [
        { value: '', label: 'All Types' },
        { value: 'B2B', label: 'B2B' },
        { value: 'B2C', label: 'B2C' },
        { value: 'Sponsor', label: 'Sponsor' }
    ];

    private searchSubject = new Subject<string>();

    constructor(
        private eventService: EventService,
        private cdr: ChangeDetectorRef
    ) {
        this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
            this.fetchRegistrations();
        });
    }

    ngOnInit(): void {
        this.fetchEvents();
    }

    async fetchEvents(): Promise<void> {
        try {
            const response = await this.eventService.newGetEvents({ page: 1, limit: 100 });
            if (response && response.success) {
                this.events = response.data.events || [];
                if (this.events.length > 0) {
                    this.selectedEventId = this.events[0]._id;
                    this.fetchRegistrations();
                }
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    async fetchRegistrations(): Promise<void> {
        if (!this.selectedEventId) {
            this.registrations = null;
            return;
        }

        this.loading = true;
        this.cdr.detectChanges();
        try {
            const response = await this.eventService.getRegistrationReport(
                this.selectedEventId,
                this.page,
                this.limit,
                this.selectedStatus || undefined,
                this.searchQuery,
                this.selectedType || undefined
            );
            this.registrations = response;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching registrations:', error);
            swalHelper.showToast('Failed to fetch registrations', 'error');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    onFilterChange(): void {
        this.page = 1;
        this.loading = true;
        this.cdr.detectChanges();
        setTimeout(() => {
            this.fetchRegistrations();
        }, 50);
    }

    onSearch(): void {
        this.page = 1;
        this.loading = true;
        this.cdr.detectChanges();
        this.searchSubject.next(this.searchQuery);
    }

    changePage(page: number): void {
        this.page = page;
        this.loading = true;
        this.cdr.detectChanges();
        setTimeout(() => {
            this.fetchRegistrations();
        }, 50);
    }


    getRegistrationType(reg: any): string {
        if (reg.isSponsor) return 'Sponsor';
        if (reg.registrationType) return reg.registrationType;
        return 'N/A';
    }
}
