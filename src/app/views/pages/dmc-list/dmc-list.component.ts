import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DmcListService, DMCList, DmcListResponse } from '../../../services/auth.service';
import { swalHelper } from '../../../core/constants/swal-helper';
import { debounceTime, Subject } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';

declare var $: any;
declare var bootstrap: any;

@Component({
    selector: 'app-dmc-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [DmcListService],
    templateUrl: './dmc-list.component.html',
    styleUrls: ['./dmc-list.component.css'],
})
export class DmcListComponent implements OnInit, AfterViewInit {
    dmcLists: DMCList[] = [];

    loading: boolean = false;
    selectedDmc: DMCList | null = null;
    dmcModal: any;
    editMode: boolean = false;

    newDmc = {
        title: '',
    };

    constructor(
        private dmcListService: DmcListService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.fetchDmcLists();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            const modalElement = document.getElementById('dmcModal');
            if (modalElement) {
                this.dmcModal = new bootstrap.Modal(modalElement);
            }
        }, 300);
    }

    async fetchDmcLists(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.dmcListService.getAllDmcLists();
            // Ensure response is an array
            this.dmcLists = Array.isArray(response) ? response : [];
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error fetching DMC lists:', error);
        } finally {
            this.loading = false;
        }
    }

    openAddModal(): void {
        this.editMode = false;
        this.newDmc = {
            title: '',
        };
        this.showModal();
    }

    openEditModal(dmc: DMCList): void {
        this.editMode = true;
        this.selectedDmc = dmc;
        this.newDmc = {
            title: dmc.title,
        };
        this.showModal();
    }

    showModal(): void {
        if (this.dmcModal) {
            this.dmcModal.show();
        } else {
            $('#dmcModal').modal('show');
        }
    }

    closeModal(): void {
        const btn = document.querySelector('#dmcModal .btn-close') as HTMLElement;
        if (btn) btn.click();

        if (this.dmcModal) {
            this.dmcModal.hide();
        } else {
            $('#dmcModal').modal('hide');
        }

        // Force cleanup backdrop if stuck
        setTimeout(() => {
            const backdrops = document.getElementsByClassName('modal-backdrop');
            if (backdrops.length > 0) {
                Array.from(backdrops).forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        }, 300);
    }

    async saveDmc(): Promise<void> {
        // Validation handled by template-driven form
        if (!this.newDmc.title.trim()) {
            return;
        }

        try {
            this.loading = true;
            if (this.editMode && this.selectedDmc) {
                const response = await this.dmcListService.updateDmcList(this.selectedDmc._id, this.newDmc);
                if (response) {
                    swalHelper.showToast('DMC List updated successfully', 'success');
                    this.closeModal();
                    this.fetchDmcLists();
                }
            } else {
                const response = await this.dmcListService.createDmcList(this.newDmc);
                if (response) {
                    swalHelper.showToast('DMC List created successfully', 'success');
                    this.closeModal();
                    this.fetchDmcLists();
                }
            }
        } catch (error: any) {
            console.error('Error saving DMC list:', error);
            swalHelper.showToast(error.message || 'Failed to save DMC list', 'error');
        } finally {
            this.loading = false;
        }
    }

    async deleteDmc(id: string): Promise<void> {
        const result = await swalHelper.confirmation(
            'Delete DMC',
            'Are you sure you want to delete this DMC? This action cannot be undone.',
            'warning'
        );
        if (result.isConfirmed) {
            try {
                this.loading = true;
                const response = await this.dmcListService.deleteDmcList(id);
                if (response) {
                    swalHelper.showToast('DMC deleted successfully', 'success');
                    this.fetchDmcLists();
                }
            } catch (error: any) {
                console.error('Error deleting DMC:', error);
                swalHelper.showToast(error.message || 'Failed to delete DMC', 'error');
            } finally {
                this.loading = false;
            }
        }
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    }
}
