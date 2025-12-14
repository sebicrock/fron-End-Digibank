// user-profile.ts 
import { Component, HostListener, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { DemandSavingsForm } from '../demand-savings-form/demand-savings-form';
import { ScheduledSavingsForm } from '../scheduled-savings-form/scheduled-savings-form';
import { LoanRequestForm } from '../loan-request-form/loan-request-form';
import { CdtForm } from '../cdt-form/cdt-form';
import { CreditCardForm } from '../credit-card-form/credit-card-form';
import { InsuranceForm } from '../insurance-form/insurance-form';
import { TransferForm } from '../transfer-form/transfer-form';
import { ServicePayment } from '../service-payment/service-payment'

// Enum para vistas
export enum Vistas {
  DASHBOARD = 'dashboard',
  AHORRO = 'ahorro',
  AHORRO_PROGRAMADO = 'ahorroProgramado',
  PRESTAMO = 'prestamo',
  CDTS = 'cdts',
  TARJETAS = 'tarjetas',
  SEGUROS = 'seguros',
  TRANSACCIONES = 'transacciones',
  PAGO_SERVICIOS = 'pagoservicios',
  DETALLE = 'detalle'
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DemandSavingsForm,
    ScheduledSavingsForm,
    LoanRequestForm,
    CdtForm,
    CreditCardForm,
    InsuranceForm,
    TransferForm,
  ],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserProfile implements OnInit, OnDestroy {

  pagoData = { empresa: 1, nombre: 'Servicios Públicos' };

  // Exponemos el enum a la plantilla HTML
  public Vistas = Vistas;

  sidebarActive = false;
  currentTime: string = '';
  private timeInterval: any;

  // Control de vistas
  vistaActual: Vistas = Vistas.DASHBOARD;
  numeroCuentaSeleccionada: number | null = null;
  numeroDePrestamoSeleccionado: number | null = null;
  idEmpresa: string = '';


  // Datos del usuario
  nombreUsuario: string = '';
  clienteId: number | null = null;
  mensajeBienvenida: string = '';

  // Datos de cuenta (para el detalle)
  datosCuentaSeleccionada: any = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadUserData();
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 60000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  loadUserData(): void {
    this.nombreUsuario = localStorage.getItem('nombre') || 'Usuario';
    this.mensajeBienvenida = localStorage.getItem('mensaje') || '';
    const id = localStorage.getItem('clienteId');
    this.clienteId = id ? Number(id) : null;

    if (!this.clienteId) this.router.navigate(['/login']);
  }

  updateTime(): void {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    this.currentTime = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  toggleSidebar(): void { this.sidebarActive = !this.sidebarActive; }
  closeSidebar(): void { this.sidebarActive = false; }

  // Navegación entre vistas
  irAFormularioAhorro(): void { this.vistaActual = Vistas.AHORRO; this.closeSidebar(); }
  irAFormularioAhorroProgramado(): void { this.vistaActual = Vistas.AHORRO_PROGRAMADO; this.closeSidebar(); }
  irAFormularioPrestamo(): void { this.vistaActual = Vistas.PRESTAMO; this.closeSidebar(); }
  irAFormularioCdts(): void { this.vistaActual = Vistas.CDTS; this.closeSidebar(); }
  irAFormularioTarjetas(): void { this.vistaActual = Vistas.TARJETAS; this.closeSidebar(); }
  irAFormularioSeguros(): void { this.vistaActual = Vistas.SEGUROS; this.closeSidebar(); }
  irAformularioTransacciones(): void { this.vistaActual = Vistas.TRANSACCIONES; this.closeSidebar(); }
  irAFormularioPagoServicios(): void { this.vistaActual = Vistas.PAGO_SERVICIOS; this.closeSidebar(); }
  volverAlDashboard(): void { this.vistaActual = Vistas.DASHBOARD; this.closeSidebar(); }

  // Detalles de cuentas, préstamos, etc.
  abrirDetalleCuenta(numeroCuenta: number): void { this.numeroCuentaSeleccionada = numeroCuenta; this.vistaActual = Vistas.DETALLE; }
  abrirDetalleDePrestamo(numeroPrestamo: number): void { this.numeroDePrestamoSeleccionado = numeroPrestamo; this.vistaActual = Vistas.DETALLE; }
  abrirDetalleCdts(numeroCdt: number): void { this.numeroDePrestamoSeleccionado = numeroCdt; this.vistaActual = Vistas.DETALLE; }
  abrirDetalleTarjetas(numeroTarjeta: number): void { this.numeroDePrestamoSeleccionado = numeroTarjeta; this.vistaActual = Vistas.DETALLE; }
  abrirDetalleDeSeguro(numeroSeguro: number): void { this.numeroDePrestamoSeleccionado = numeroSeguro; this.vistaActual = Vistas.DETALLE; }
  abrirDetalleDetransaccion(numeroTransaccion: number): void { this.numeroDePrestamoSeleccionado = numeroTransaccion; this.vistaActual = Vistas.DETALLE; }
  abrirDetallePagoServicios(idEmpresa: any) {
    this.idEmpresa = idEmpresa;
    this.vistaActual = Vistas.DETALLE;
  }

  cerrarDetalleCuenta(): void { this.datosCuentaSeleccionada = null; this.numeroCuentaSeleccionada = null; this.volverAlDashboard(); }

  cerrarSesion(): void {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      localStorage.clear();
      this.router.navigate(['/login']);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth <= 768) this.sidebarActive = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (this.sidebarActive && keyboardEvent.key === 'Escape') this.closeSidebar();
  }

  get TRANSACCIONES(): Vistas {
    return Vistas.TRANSACCIONES;
  }

  preventDefault(e: Event): void {
    e.preventDefault();
  }

}
