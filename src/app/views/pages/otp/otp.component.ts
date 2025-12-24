import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OtpService, OtpRecord, OtpResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-otp-records',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
    providers: [OtpService],
    templateUrl:'./otp.component.html',
    styleUrls: ['./otp.component.css'],
})
export class OtpRecordsComponent implements OnInit {
    otpRecords: OtpResponse = {
        docs: [],
        totalDocs: 0,
        limit: 10,
        page: 1,
        totalPages: 0,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
    };

    loading: boolean = false;
    searchQuery: string = '';

    payload = {
        search: '',
        page: 1,
        limit: 10
    };

    private searchSubject = new Subject<string>();

    constructor(
        private otpService: OtpService,
        private cdr: ChangeDetectorRef
    ) {
        this.searchSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.fetchOtpRecords();
        });
    }

    ngOnInit(): void {
        this.fetchOtpRecords();
    }

    async fetchOtpRecords(): Promise<void> {
        this.loading = true;

        try {
            const requestData = {
                page: this.payload.page,
                limit: this.payload.limit,
                search: this.payload.search
            };

            const response = await this.otpService.getOtpRecords(requestData);
            this.otpRecords = response;
            this.cdr.detectChanges();
        } catch (error : any) {
            console.error('Error fetching OTP records:', error);
            swalHelper.showToast(error?.error?.message, 'warning');
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
        this.fetchOtpRecords();
    }

    onPageChange(page: number): void {
        this.payload.page = page;
        this.fetchOtpRecords();
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }
}