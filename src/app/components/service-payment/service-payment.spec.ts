import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicePayment } from './service-payment';

describe('ServicePayment', () => {
  let component: ServicePayment;
  let fixture: ComponentFixture<ServicePayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicePayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicePayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
