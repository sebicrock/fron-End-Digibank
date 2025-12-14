import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoanRequestForm } from './loan-request-form';

describe('LoanRequestForm', () => {
  let component: LoanRequestForm;
  let fixture: ComponentFixture<LoanRequestForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoanRequestForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoanRequestForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
