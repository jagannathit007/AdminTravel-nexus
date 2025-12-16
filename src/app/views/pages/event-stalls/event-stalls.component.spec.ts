import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventStallsComponent } from './event-stalls.component';

describe('EventStallsComponent', () => {
  let component: EventStallsComponent;
  let fixture: ComponentFixture<EventStallsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventStallsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventStallsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

