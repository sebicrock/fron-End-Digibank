import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandSavingsForm } from './demand-savings-form';

describe('DemandSavingsForm', () => {
  let component: DemandSavingsForm;
  let fixture: ComponentFixture<DemandSavingsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandSavingsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandSavingsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
