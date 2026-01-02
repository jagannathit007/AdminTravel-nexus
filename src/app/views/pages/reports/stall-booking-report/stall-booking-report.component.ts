import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../services/auth.service';
import { swalHelper } from '../../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
    selector: 'app-stall-booking-report',
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, NgxPaginationModule],
    providers: [EventService],
    templateUrl: './stall-booking-report.component.html',
    styleUrls: ['./stall-booking-report.component.css']
})
export class StallBookingReportComponent implements OnInit {
    events: any[] = [];
    selectedEventId: string = '';
    bookings: any = null;
    loading: boolean = false;
    page: number = 1;
    limit: number = 10;
    searchQuery: string = '';
    selectedStatus: string = '';

    private searchSubject = new Subject<string>();

    statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    constructor(
        private eventService: EventService,
        private cdr: ChangeDetectorRef
    ) {
        this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
            this.fetchBookings();
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
                    this.fetchBookings();
                }
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    async fetchBookings(): Promise<void> {
        if (!this.selectedEventId) {
            this.bookings = null;
            return;
        }

        this.loading = true;
        this.cdr.detectChanges();
        try {
            const response = await this.eventService.getStallBookingReport({
                eventId: this.selectedEventId,
                page: this.page,
                limit: this.limit,
                status: this.selectedStatus || undefined,
                search: this.searchQuery
            });
            this.bookings = response;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching stall bookings:', error);
            swalHelper.showToast('Failed to fetch stall bookings', 'error');
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
            this.fetchBookings();
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
        this.fetchBookings();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'approved': return 'bg-success';
            case 'pending': return 'bg-warning text-dark';
            case 'rejected': return 'bg-danger';
            case 'cancelled': return 'bg-secondary';
            default: return 'bg-info';
        }
    }
}
