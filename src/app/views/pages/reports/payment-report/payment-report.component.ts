import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../../../services/auth.service';
import { swalHelper } from '../../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-payment-report',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
    providers: [EventService],
    templateUrl: './payment-report.component.html',
    styleUrls: ['./payment-report.component.css']
})
export class PaymentReportComponent implements OnInit {
    events: any[] = [];
    selectedEventId: string = '';
    registrations: any = null;
    loading: boolean = false;
    page: number = 1;
    limit: number = 10;
    searchQuery: string = '';
    selectedPaymentStatus: string = '';

    paymentStatusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'failed', label: 'Failed' }
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
            const response = await this.eventService.getPaymentReport(
                this.selectedEventId,
                this.page,
                this.limit,
                this.selectedPaymentStatus || undefined,
                this.searchQuery
            );
            this.registrations = response;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching registrations:', error);
            swalHelper.showToast('Failed to fetch payment data', 'error');
        } finally {
            this.loading = false;
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
        this.fetchRegistrations();
    }

    getUserName(reg: any): string {
        return reg?.name || reg?.userDetails?.name || 'Unknown User';
    }

    getTransactionId(reg: any): string {
        return reg?.transactionId || reg?.paymentDetails?.transactionId || 'N/A';
    }

    getAmount(reg: any): number {
        return reg?.amount || reg?.paymentDetails?.amount || 0;
    }

    getPaymentStatusClass(reg: any): string {
        const status = (reg?.paymentStatus || 'pending').toLowerCase();
        if (status === 'completed' || status === 'paid' || status === 'success') return 'bg-success';
        if (status === 'pending') return 'bg-warning text-dark';
        if (status === 'failed') return 'bg-danger';
        return 'bg-secondary';
    }
}


