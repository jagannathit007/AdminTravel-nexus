import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService, EventService } from '../../../../services/auth.service'; // Assuming EventService is exported
import { swalHelper } from '../../../../core/constants/swal-helper';
import { environment } from 'src/env/env.local';

import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-event-review-report',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
    providers: [FeedbackService, EventService], // Provide EventService if needed for event list
    templateUrl: './event-review-report.component.html',
    styleUrls: ['./event-review-report.component.css']
})
export class EventReviewReportComponent implements OnInit {
    events: any[] = [];
    selectedEventId: string = '';
    reviews: any = null;
    loading: boolean = false;
    page: number = 1;
    limit: number = 10;
    imageurl = environment.imageUrl;



    protected Math = Math;

    constructor(
        private feedbackService: FeedbackService,
        private eventService: EventService, // Optional: for fetching events list if we want to filter by event
        private cdr: ChangeDetectorRef
    ) { }


    ngOnInit(): void {
        this.fetchEvents(); // Identify which events to filter by
        // Initial fetch without event filter or handled by fetchEvents()
    }

    async fetchEvents(): Promise<void> {
        try {
            const response = await this.eventService.newGetEvents({ page: 1, limit: 100 });
            if (response && response.success) {
                this.events = response.data.events || [];
                if (this.events.length > 0) {
                    this.selectedEventId = this.events[0]._id;
                    this.fetchReviews();
                }
                this.cdr.detectChanges();
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    async fetchReviews(): Promise<void> {
        if (!this.selectedEventId) {
            return;
        }
        this.loading = true;
        this.cdr.detectChanges();
        try {
            const response = await this.eventService.getEventReviews(
                this.selectedEventId,
                this.page,
                this.limit
            );
            this.reviews = response;
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching reviews:', error);
            swalHelper.showToast('Failed to fetch reviews', 'error');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    onFilterChange(): void {
        this.page = 1;
        this.fetchReviews();
    }



    changePage(page: number): void {
        this.page = page;
        this.fetchReviews();
    }
    getImageUrl(imagePath: string): string {
        if (!imagePath) return '';
        const baseUrl = this.imageurl;
        return imagePath.startsWith('http') ? imagePath : baseUrl + imagePath;
    }

}
