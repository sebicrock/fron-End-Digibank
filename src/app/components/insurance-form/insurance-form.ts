import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Categoria {
  id: string;
  nombre: string;
  icono: SafeHtml;
  color: string;
}

interface PlanSeguro {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  categoriaId: string;
  precioMensual: number;
  coberturaMaxima: number;
  deducible: number;
  coberturas: string[];
  icono: SafeHtml;
  color: string;
  destacado: boolean;
}

interface SeguroContratado {
  id: number;
  nombre: string;
  categoria: string;
  numeroPoliza: string;
  fechaInicio: Date;
  fechaVencimiento: Date;
  primaMensual: number;
  coberturaMaxima: number;
  coberturaUtilizada: number;
  estado: string;
  icono: SafeHtml;
  color: string;
}

interface Siniestro {
  id: number;
  tipoSeguro: string;
  numeroCaso: string;
  descripcion: string;
  fechaReporte: Date;
  montoReclamado: number;
  estado: string;
}

interface Cuenta {
  numeroCuenta: number;
  tipoCuenta: string;
  saldo: number;
}

@Component({
  selector: 'app-insurance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './insurance-form.html',
  styleUrls: ['./insurance-form.css']
})
export class InsuranceForm implements OnInit {
  @Output() volverClick = new EventEmitter<void>();
  @Output() seguroContratado = new EventEmitter<any>();

  // API URL - Ajusta según tu backend
  private apiUrl = 'http://localhost:8080/api';

  // Control de vistas
  vistaActual: 'planes' | 'miseguros' | 'siniestros' = 'planes';

  // Categorías
  categorias: Categoria[] = [];
  categoriaSeleccionada = 'all';

  // Planes
  planesDisponibles: PlanSeguro[] = [];
  planesFiltrados: PlanSeguro[] = [];
  cargandoPlanes = false;

  // Seguros contratados
  misSeguros: SeguroContratado[] = [];
  cargandoMisSeguros = false;

  // Siniestros
  siniestros: Siniestro[] = [];

  // Modal de contratación
  mostrarModalContratacion = false;
  planSeleccionado: PlanSeguro | null = null;
  contratacionForm!: FormGroup;
  cuentasDebito: Cuenta[] = [];

  // Estados
  procesando = false;
  mensajeExito = '';
  mensajeError = '';

  // Cliente ID
  clienteId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.inicializarCategorias();
    this.inicializarFormulario();
    this.cargarClienteId();
    this.cargarPlanes();
    this.cargarCuentas();
  }

  inicializarCategorias(): void {
    const categoriasData = [
      {
        id: 'all',
        nombre: 'Todos',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>`,
        color: 'purple'
      },
      {
        id: 'vida',
        nombre: 'Vida',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor"/>
        </svg>`,
        color: 'red'
      },
      {
        id: 'salud',
        nombre: 'Salud',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM18 14H14V18H10V14H6V10H10V6H14V10H18V14Z" fill="currentColor"/>
        </svg>`,
        color: 'green'
      },
      {
        id: 'vehiculo',
        nombre: 'Vehículo',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5C5 13.67 5.67 13 6.5 13C7.33 13 8 13.67 8 14.5C8 15.33 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5C16 13.67 16.67 13 17.5 13C18.33 13 19 13.67 19 14.5C19 15.33 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" fill="currentColor"/>
        </svg>`,
        color: 'blue'
      },
      {
        id: 'hogar',
        nombre: 'Hogar',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
        </svg>`,
        color: 'orange'
      },
      {
        id: 'viaje',
        nombre: 'Viaje',
        icono: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="currentColor"/>
        </svg>`,
        color: 'cyan'
      }
    ];

    this.categorias = categoriasData.map(cat => ({
      ...cat,
      icono: this.sanitizer.bypassSecurityTrustHtml(cat.icono)
    }));
  }

  inicializarFormulario(): void {
    this.contratacionForm = this.fb.group({
      beneficiario: ['', Validators.required],
      identificacion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      direccion: ['', Validators.required],
      numeroCuenta: ['', Validators.required],
      aceptaTerminos: [false, Validators.requiredTrue]
    });
  }

  cargarClienteId(): void {
    const id = localStorage.getItem('clienteId');
    this.clienteId = id ? Number(id) : null;

    if (!this.clienteId) {
      this.mensajeError = 'No se encontró información del cliente. Por favor, inicie sesión nuevamente.';
      console.error('❌ Cliente ID no encontrado');
    }
  }

  cargarPlanes(): void {
    this.cargandoPlanes = true;
    this.mensajeError = '';

    // Ajusta la URL según tu endpoint
    this.http.get<any[]>(`${this.apiUrl}/seguros/planes`)
      .subscribe({
        next: (planes) => {
          this.planesDisponibles = planes.map(plan => ({
            ...plan,
            icono: this.sanitizer.bypassSecurityTrustHtml(this.getIconoPorCategoria(plan.categoriaId)),
            fechaInicio: plan.fechaInicio ? new Date(plan.fechaInicio) : undefined,
            fechaVencimiento: plan.fechaVencimiento ? new Date(plan.fechaVencimiento) : undefined
          }));
          this.planesFiltrados = this.planesDisponibles;
          console.log('✅ Planes cargados:', planes);
          this.cargandoPlanes = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar planes:', error);
          this.mensajeError = 'No se pudieron cargar los planes de seguros.';
          this.cargandoPlanes = false;
          
          // Mock data para desarrollo
          this.cargarPlanesMock();
        }
      });
  }

  cargarPlanesMock(): void {
    const planesMock = [
      {
        id: 1,
        nombre: 'Seguro de Vida Básico',
        descripcion: 'Protección esencial para ti y tu familia',
        categoria: 'Vida',
        categoriaId: 'vida',
        precioMensual: 45000,
        coberturaMaxima: 50000000,
        deducible: 10,
        coberturas: ['Muerte natural', 'Muerte accidental', 'Invalidez total'],
        color: 'red',
        destacado: false
      },
      {
        id: 2,
        nombre: 'Seguro de Salud Premium',
        descripcion: 'Cobertura médica completa para toda la familia',
        categoria: 'Salud',
        categoriaId: 'salud',
        precioMensual: 150000,
        coberturaMaxima: 100000000,
        deducible: 15,
        coberturas: ['Hospitalización', 'Cirugías', 'Medicamentos', 'Consultas médicas'],
        color: 'green',
        destacado: true
      },
      {
        id: 3,
        nombre: 'Todo Riesgo Vehículo',
        descripcion: 'Protección completa para tu automóvil',
        categoria: 'Vehículo',
        categoriaId: 'vehiculo',
        precioMensual: 180000,
        coberturaMaxima: 80000000,
        deducible: 20,
        coberturas: ['Daños propios', 'Responsabilidad civil', 'Robo', 'Asistencia vial'],
        color: 'blue',
        destacado: false
      },
      {
        id: 4,
        nombre: 'Seguro Hogar Integral',
        descripcion: 'Protege tu hogar y tus bienes',
        categoria: 'Hogar',
        categoriaId: 'hogar',
        precioMensual: 95000,
        coberturaMaxima: 200000000,
        deducible: 10,
        coberturas: ['Incendio', 'Robo', 'Daños por agua', 'Responsabilidad civil'],
        color: 'orange',
        destacado: false
      }
    ];

    this.planesDisponibles = planesMock.map(plan => ({
      ...plan,
      icono: this.sanitizer.bypassSecurityTrustHtml(this.getIconoPorCategoria(plan.categoriaId))
    }));
    this.planesFiltrados = this.planesDisponibles;
    this.cargandoPlanes = false;
  }

  getIconoPorCategoria(categoriaId: string): string {
    const iconos: { [key: string]: string } = {
      vida: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="currentColor"/>
      </svg>`,
      salud: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM18 14H14V18H10V14H6V10H10V6H14V10H18V14Z" fill="currentColor"/>
      </svg>`,
      vehiculo: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01Z" fill="currentColor"/>
      </svg>`,
      hogar: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
      </svg>`,
      viaje: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" fill="currentColor"/>
      </svg>`
    };
    return iconos[categoriaId]; //|| //iconos.vida;
  }

  cargarCuentas(): void {
    if (!this.clienteId) return;

    // Ajusta la URL según tu endpoint
    this.http.get<Cuenta[]>(`${this.apiUrl}/cuentas/cliente/${this.clienteId}`)
      .subscribe({
        next: (cuentas) => {
          this.cuentasDebito = cuentas;
          console.log('✅ Cuentas cargadas:', cuentas);
        },
        error: (error) => {
          console.error('❌ Error al cargar cuentas:', error);
        }
      });
  }

  cargarMisSeguros(): void {
    if (!this.clienteId) return;

    this.cargandoMisSeguros = true;

    // Ajusta la URL según tu endpoint
    this.http.get<any[]>(`${this.apiUrl}/seguros/cliente/${this.clienteId}`)
      .subscribe({
        next: (seguros) => {
          this.misSeguros = seguros.map(seguro => ({
            ...seguro,
            fechaInicio: new Date(seguro.fechaInicio),
            fechaVencimiento: new Date(seguro.fechaVencimiento),
            icono: this.sanitizer.bypassSecurityTrustHtml(this.getIconoPorCategoria(seguro.categoriaId))
          }));
          console.log('✅ Seguros contratados cargados:', seguros);
          this.cargandoMisSeguros = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar seguros:', error);
          this.cargandoMisSeguros = false;
        }
      });
  }

  cargarSiniestros(): void {
    if (!this.clienteId) return;

    // Ajusta la URL según tu endpoint
    this.http.get<Siniestro[]>(`${this.apiUrl}/seguros/siniestros/${this.clienteId}`)
      .subscribe({
        next: (siniestros) => {
          this.siniestros = siniestros.map(s => ({
            ...s,
            fechaReporte: new Date(s.fechaReporte)
          }));
          console.log('✅ Siniestros cargados:', siniestros);
        },
        error: (error) => {
          console.error('❌ Error al cargar siniestros:', error);
        }
      });
  }

  cambiarVista(vista: 'planes' | 'miseguros' | 'siniestros'): void {
    this.vistaActual = vista;
    this.mensajeError = '';
    this.mensajeExito = '';

    if (vista === 'miseguros') {
      this.cargarMisSeguros();
    } else if (vista === 'siniestros') {
      this.cargarSiniestros();
    }
  }

  filtrarPorCategoria(categoriaId: string): void {
    this.categoriaSeleccionada = categoriaId;
    
    if (categoriaId === 'all') {
      this.planesFiltrados = this.planesDisponibles;
    } else {
      this.planesFiltrados = this.planesDisponibles.filter(
        plan => plan.categoriaId === categoriaId
      );
    }
  }

  getCategoriaActual(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.categoriaSeleccionada);
  }

  seleccionarPlan(plan: PlanSeguro): void {
    this.planSeleccionado = plan;
    this.mostrarModalContratacion = true;
    this.contratacionForm.reset();
  }

  cerrarModal(): void {
    this.mostrarModalContratacion = false;
    this.planSeleccionado = null;
    this.contratacionForm.reset();
  }

  contratarSeguro(): void {
    if (this.contratacionForm.invalid || !this.planSeleccionado) {
      return;
    }

    this.procesando = true;
    this.mensajeError = '';

    const contratacionData = {
      planId: this.planSeleccionado.id,
      clienteId: this.clienteId,
      ...this.contratacionForm.value
    };

    console.log('📋 Contratando seguro:', contratacionData);

    // Ajusta la URL según tu endpoint
    this.http.post<any>(`${this.apiUrl}/seguros/contratar`, contratacionData)
      .subscribe({
        next: (response) => {
          console.log('✅ Seguro contratado:', response);
          this.mensajeExito = `Seguro ${this.planSeleccionado?.nombre} contratado exitosamente. Póliza: ${response.numeroPoliza}`;
          this.procesando = false;
          this.cerrarModal();

          // Emitir evento de éxito
          this.seguroContratado.emit(response);

          // Cambiar a vista de mis seguros después de 2 segundos
          setTimeout(() => {
            this.cambiarVista('miseguros');
            this.mensajeExito = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error al contratar seguro:', error);
          this.mensajeError = error.error?.mensaje || 'Ocurrió un error al contratar el seguro.';
          this.procesando = false;
        }
      });
  }

  calcularPorcentajeUtilizado(seguro: SeguroContratado): number {
    return Math.round((seguro.coberturaUtilizada / seguro.coberturaMaxima) * 100);
  }

  verDetalleSeguro(seguro: SeguroContratado): void {
    console.log('Ver detalle de seguro:', seguro);
    // Implementar navegación o modal de detalle
  }

  reportarSiniestro(seguro: SeguroContratado): void {
    console.log('Reportar siniestro para:', seguro);
    // Implementar formulario de reporte de siniestro
    alert(`Función de reporte de siniestro para póliza ${seguro.numeroPoliza} - En desarrollo`);
  }

  cancelarSeguro(seguroId: number): void {
    if (!confirm('¿Estás seguro de que deseas cancelar este seguro? Esta acción no se puede deshacer.')) {
      return;
    }

    // Ajusta la URL según tu endpoint
    this.http.delete(`${this.apiUrl}/seguros/${seguroId}`)
      .subscribe({
        next: () => {
          console.log('✅ Seguro cancelado');
          this.mensajeExito = 'Seguro cancelado exitosamente';
          this.cargarMisSeguros();
        },
        error: (error) => {
          console.error('❌ Error al cancelar seguro:', error);
          this.mensajeError = 'No se pudo cancelar el seguro.';
        }
      });
  }

  verDetalleSiniestro(siniestro: Siniestro): void {
    console.log('Ver detalle de siniestro:', siniestro);
    // Implementar modal o navegación de detalle
  }

  volver(): void {
    this.volverClick.emit();
  }
}