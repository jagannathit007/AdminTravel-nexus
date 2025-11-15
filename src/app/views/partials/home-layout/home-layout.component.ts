import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { HeaderComponent } from '../header/header.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { swalHelper } from 'src/app/core/constants/swal-helper';
import { AppStorage } from 'src/app/core/utilities/app-storage';

@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SideBarComponent,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.scss'],
})
export class HomeLayoutComponent implements OnInit {
  ngOnInit(): void {}

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    const isInputField = target?.tagName === 'INPUT' || 
                         target?.tagName === 'TEXTAREA' ||
                         target?.isContentEditable;
    
    // Always allow typing in input fields (including capital I with Shift+I)
    if (isInputField) {
      return;
    }
    
    // Prevent developer tools shortcuts, but allow regular typing
    // Only block when modifier keys (Ctrl/Alt/Meta) are pressed with 'i'
    // Do NOT block Shift+I alone (that's just typing capital I)
    if (
      (event.ctrlKey || event.metaKey || event.altKey) &&
      event.key.toLowerCase() === 'i'
    ) {
      // Prevent Ctrl+I, Alt+I, Meta+I, Ctrl+Shift+I (developer tools shortcuts)
      event.preventDefault();
    } else if (event.key === 'F12') {
      // Prevents F12 (developer tools)
      event.preventDefault();
    }
  }
}
