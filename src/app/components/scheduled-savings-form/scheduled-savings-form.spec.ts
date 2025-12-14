import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledSavingsForm } from './scheduled-savings-form';

describe('ScheduledSavingsForm', () => {
  let component: ScheduledSavingsForm;
  let fixture: ComponentFixture<ScheduledSavingsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduledSavingsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduledSavingsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
