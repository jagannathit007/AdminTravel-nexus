import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OneToOneService, OneToOne, OneToOneResponse } from '../../../services/auth.service';
import { ChapterService, Chapter } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExportService } from '../../../services/export.service';
import { environment } from 'src/env/env.local';

@Component({
  selector: 'app-one-to-one',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule, NgSelectModule],
  providers: [OneToOneService, ChapterService, ExportService],
  templateUrl: './oneToone.component.html',
  styleUrls: ['./oneToone.component.css'],
})
export class OneToOneComponent implements OnInit {
  oneToOnes: OneToOneResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null
  };

  chapters: Chapter[] = [];
  loading: boolean = false;
  chaptersLoading: boolean = false;
  exporting: boolean = false;

  Math = Math;

  filters = {
    page: 1,
    limit: 10,
    chapter_name: null,
    startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
    endDate: this.formatDateForInput(new Date())
  };

  paginationConfig = {
    id: 'one-to-one-pagination'
  };

  private filterSubject = new Subject<void>();

  constructor(
    private oneToOneService: OneToOneService,
    private chapterService: ChapterService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchOneToOnes();
    });
  }

  ngOnInit(): void {
    this.fetchChapters();
    this.fetchOneToOnes();
  }

  async fetchOneToOnes(): Promise<void> {
    this.loading = true;
    try {
      const requestParams = {
        page: this.filters.page,
        limit: this.filters.limit,
        chapter_name: this.filters.chapter_name || undefined,
        startDate: this.filters.startDate || undefined,
        endDate: this.filters.endDate || undefined
      };

      const response = await this.oneToOneService.getOneToOneReport(requestParams);
      this.oneToOnes = {
        ...response,
        docs: response.docs.map((doc: any) => ({
          ...doc,
          memberId1: doc.memberId1 || { name: 'Unknown', chapter_name: 'N/A', profilePic: '' },
          memberId2: doc.memberId2 || { name: 'Unknown', chapter_name: 'N/A', profilePic: '' },
          initiatedBy: doc.initiatedBy || { name: 'Unknown', profilePic: '' },
          meet_place: doc.meet_place || 'N/A',
          topics: doc.topics || 'N/A'
        }))
      };
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching one-to-ones:', error);
      swalHelper.showToast('Failed to fetch one-to-one meetings', 'error');
      this.oneToOnes = {
        docs: [],
        totalDocs: 0,
        limit: this.filters.limit,
        page: this.filters.page,
        totalPages: 0,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null
      };
      this.cdr.detectChanges();
    } finally {
      this.loading = false;
    }
  }

  async fetchChapters(): Promise<void> {
    this.chaptersLoading = true;
    try {
      const response = await this.chapterService.getAllChapters({
        page: 1,
        limit: 1000,
        search: ''
      });
      this.chapters = response.docs || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      swalHelper.showToast('Failed to fetch chapters', 'error');
    } finally {
      this.chaptersLoading = false;
    }
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.filterSubject.next();
  }

  onPageChange(page: number): void {
    if (page !== this.filters.page) {
      this.filters.page = page;
      this.fetchOneToOnes();
    }
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      chapter_name: null,
      startDate: this.formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 30))),
      endDate: this.formatDateForInput(new Date())
    };
    this.fetchOneToOnes();
  }

  getProfilePicUrl(picPath?: string): string {
    if (!picPath) return 'assets/images/default-avatar.png';
    return `${environment.imageUrl}/${picPath}`;
  }

  formatDate(dateString?: string): string {
    if (!dateString || isNaN(new Date(dateString).getTime())) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async exportToExcel(): Promise<void> {
    try {
      this.exporting = true;
      const exportParams = {
        chapter_name: this.filters.chapter_name || undefined,
        startDate: this.filters.startDate || undefined,
        endDate: this.filters.endDate || undefined,
        limit: 10000,
        page: 1
      };

      const allData = await this.oneToOneService.getAllOneToOne(exportParams);

      const exportData = allData.docs.map((oneToOne, index) => {
        return {
          'Sr No': index + 1,
          'Meeting From': oneToOne.memberId1?.name || 'Unknown',
          'From Chapter': oneToOne.memberId1?.chapter_name || 'N/A',
          'Meeting With': oneToOne.memberId2?.name || 'Unknown',
          'With Chapter': oneToOne.memberId2?.chapter_name || 'N/A',
          'Initiated By': oneToOne.initiatedBy?.name || 'Unknown',
          'Meeting Place': oneToOne.meet_place || 'N/A',
          'Meeting Date/Time': this.formatDate(oneToOne.date),
          'Topics Of Conversation': oneToOne.topics || 'N/A'
        };
      });

      const fileName = `OneToOne_Meetings_${this.formatDateForFileName(new Date())}`;
      await this.exportService.exportToExcel(exportData, fileName);
      swalHelper.showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      swalHelper.showToast('Failed to export to Excel', 'error');
    } finally {
      this.exporting = false;
    }
  }

  async exportToPDF(): Promise<void> {
    try {
      this.exporting = true;
      const exportParams = {
        chapter_name: this.filters.chapter_name || undefined,
        startDate: this.filters.startDate || undefined,
        endDate: this.filters.endDate || undefined,
        limit: 10000,
        page: 1
      };

      const allData = await this.oneToOneService.getAllOneToOne(exportParams);

      const fileName = `OneToOne_Meetings_${this.formatDateForFileName(new Date())}`;
      const columns = [
        { header: 'Sr No', dataKey: 'srNo' },
        { header: 'Meeting From', dataKey: 'meetingFrom' },
        { header: 'Meeting With', dataKey: 'meetingWith' },
        { header: 'Initiated By', dataKey: 'initiatedBy' },
        { header: 'Meeting Place', dataKey: 'meetingPlace' },
        { header: 'Meeting Date/Time', dataKey: 'meetingDateTime' },
        { header: 'Topics', dataKey: 'topics' }
      ];

      const data = allData.docs.map((oneToOne, index) => {
        return {
          srNo: index + 1,
          meetingFrom: `${oneToOne.memberId1?.name || 'Unknown'} (${oneToOne.memberId1?.chapter_name || 'N/A'})`,
          meetingWith: `${oneToOne.memberId2?.name || 'Unknown'} (${oneToOne.memberId2?.chapter_name || 'N/A'})`,
          initiatedBy: oneToOne.initiatedBy?.name || 'N/A',
          meetingPlace: oneToOne.meet_place || 'N/A',
          meetingDateTime: this.formatDate(oneToOne.date),
          topics: oneToOne.topics || ''
        };
      });

      const title = 'One-to-One Meetings Report';
      let subtitle = 'All One-to-One Meetings';
      if (this.filters.chapter_name) {
        subtitle = `Chapter: ${this.filters.chapter_name}`;
      }
      if (this.filters.startDate && this.filters.endDate) {
        subtitle += ` | Period: ${this.formatDate(this.filters.startDate)} to ${this.formatDate(this.filters.endDate)}`;
      }

      await this.exportService.exportToPDF(columns, data, title, subtitle, fileName);
      swalHelper.showToast('PDF file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      swalHelper.showToast('Failed to export to PDF', 'error');
    } finally {
      this.exporting = false;
    }
  }

  private formatDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }
}