import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OneToOneService } from '../../../../services/auth.service';
import { swalHelper } from '../../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
    selector: 'app-one-to-one-event-report',
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, NgxPaginationModule],
    providers: [OneToOneService],
    templateUrl: './one-to-one-report.component.html',
    styleUrls: ['./one-to-one-report.component.css']
})
export class OneToOneReportComponent implements OnInit {
    oneToOnes: any = null;
    loading: boolean = false;
    page: number = 1;
    limit: number = 10;
    searchQuery: string = '';

    private searchSubject = new Subject<string>();

    constructor(
        private oneToOneService: OneToOneService,
        private cdr: ChangeDetectorRef
    ) {
        this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
            this.fetchReports();
        });
    }

    ngOnInit(): void {
        this.fetchReports();
    }

    async fetchReports(): Promise<void> {
        this.loading = true;
        this.cdr.detectChanges();
        try {
            // Fetch One-To-Ones with pagination and search
            const oneToOneResponse = await this.oneToOneService.getOneToOneReport({
                page: this.page,
                limit: this.limit,
                search: this.searchQuery
            });

            this.oneToOnes = oneToOneResponse;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching report data:', error);
            swalHelper.showToast('Failed to fetch report data', 'error');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
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
            this.fetchReports();
        }, 50);
    }
}
