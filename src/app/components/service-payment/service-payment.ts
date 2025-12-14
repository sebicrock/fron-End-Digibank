import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-service-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './service-payment.html',
  styleUrls: ['./service-payment.css'],
})
export class ServicePayment implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irFormularioPAgoServicios = new EventEmitter<String>();

  clienteId: number = 0;
  categoriaSeleccionada: string = '';
  consultando: boolean = false;
  isSubmitting: boolean = false;
  mensaje: string = '';
  mensajeTipo: 'success' | 'error' | '' = '';

  facturaConsultada: any = null;
  cuentasDisponibles: any[] = [];
  comision: number = 1500; // Comisión fija por pago
  fechaMinima: string = '';
  periodoActual: string = '';

  pagoData = {
    empresa: '',
    numeroReferencia: '',
    periodo: '',
    monto: 0,
    codigoConvenio: '',
    cuentaDebito: '',
    programado: false,
    fechaProgramada: '',
    recurrente: false
  };

  categorias = [
    {
      id: 'SERVICIOS_PUBLICOS',
      nombre: 'Servicios Públicos',
      descripcion: 'Agua, luz, gas',
      icono: '💡',
      color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    },
    {
      id: 'TELECOMUNICACIONES',
      nombre: 'Telecomunicaciones',
      descripcion: 'Internet, TV, telefonía',
      icono: '📱',
      color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
    },
    {
      id: 'EDUCACION',
      nombre: 'Educación',
      descripcion: 'Colegios, universidades',
      icono: '🎓',
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      id: 'SEGUROS',
      nombre: 'Seguros',
      descripcion: 'Vida, salud, auto',
      icono: '🛡️',
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'IMPUESTOS',
      nombre: 'Impuestos',
      descripcion: 'Predial, vehículo',
      icono: '🏛️',
      color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    {
      id: 'OTROS',
      nombre: 'Otros Servicios',
      descripcion: 'Administración, etc.',
      icono: '📋',
      color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    }
  ];

  empresasPorCategoria: { [key: string]: any[] } = {
    'SERVICIOS_PUBLICOS': [
      { id: 'EAAB', nombre: 'Acueducto de Bogotá - EAAB' },
      { id: 'CODENSA', nombre: 'Codensa - Energía' },
      { id: 'VANTI', nombre: 'Vanti - Gas Natural' },
      { id: 'EPM', nombre: 'EPM - Empresas Públicas de Medellín' }
    ],
    'TELECOMUNICACIONES': [
      { id: 'CLARO', nombre: 'Claro Colombia' },
      { id: 'MOVISTAR', nombre: 'Movistar' },
      { id: 'TIGO', nombre: 'Tigo' },
      { id: 'ETB', nombre: 'ETB' },
      { id: 'DIRECTV', nombre: 'DirecTV' }
    ],
    'EDUCACION': [
      { id: 'UNAL', nombre: 'Universidad Nacional' },
      { id: 'ANDES', nombre: 'Universidad de los Andes' },
      { id: 'JAVERIANA', nombre: 'Universidad Javeriana' },
      { id: 'ROSARIO', nombre: 'Universidad del Rosario' }
    ],
    'SEGUROS': [
      { id: 'SURA', nombre: 'Seguros SURA' },
      { id: 'BOLIVAR', nombre: 'Seguros Bolívar' },
      { id: 'MAPFRE', nombre: 'MAPFRE Seguros' },
      { id: 'LIBERTY', nombre: 'Liberty Seguros' }
    ],
    'IMPUESTOS': [
      { id: 'DIAN', nombre: 'DIAN - Impuestos Nacionales' },
      { id: 'DISTRITO', nombre: 'Secretaría Distrital de Hacienda' },
      { id: 'TRANSITO', nombre: 'Secretaría de Tránsito' }
    ],
    'OTROS': [
      { id: 'ADMIN', nombre: 'Administración Conjunto Residencial' },
      { id: 'OTROS_SERV', nombre: 'Otros Servicios' }
    ]
  };

  constructor(private http: HttpClient) {
    // Fecha mínima (hoy)
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
    
    // Período actual (mes/año)
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    this.periodoActual = `${year}-${month}`;
  }

  ngOnInit() {
    this.clienteId = Number(localStorage.getItem('clienteId')) || 0;
    if (this.clienteId > 0) {
      this.cargarCuentas();
    }
  }

  cargarCuentas() {
    const apiUrl = `http://localhost:8080/bank/cuentas/cliente/${this.clienteId}`;
    this.http.get<any[]>(apiUrl).subscribe({
      next: (cuentas) => {
        this.cuentasDisponibles = cuentas.filter(c => c.estado === 'ACTIVA');
        console.log('✅ Cuentas cargadas:', this.cuentasDisponibles.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar cuentas:', error);
        this.mostrarMensaje('No se pudieron cargar las cuentas disponibles.', 'error');
      }
    });
  }

  seleccionarCategoria(categoria: any) {
    this.categoriaSeleccionada = categoria.id;
    this.pagoData.empresa = '';
    this.facturaConsultada = null;
    console.log('Categoría seleccionada:', categoria.nombre);
  }

  getEmpresasPorCategoria(): any[] {
    return this.empresasPorCategoria[this.categoriaSeleccionada] || [];
  }

  cargarDatosEmpresa() {
    // Limpiar factura consultada cuando cambia la empresa
    this.facturaConsultada = null;
    this.pagoData.monto = 0;
  }

  consultarFactura() {
    if (!this.pagoData.empresa || !this.pagoData.numeroReferencia) {
      this.mostrarMensaje('Ingrese la empresa y el número de referencia.', 'error');
      return;
    }

    this.consultando = true;
    const apiUrl = 'http://localhost:8080/bank/ConsultarFactura';
    
    const datos = {
      empresa: this.pagoData.empresa,
      referencia: this.pagoData.numeroReferencia,
      periodo: this.pagoData.periodo
    };

    console.log('📤 Consultando factura:', datos);

    this.http.post<any>(apiUrl, datos).subscribe({
      next: (response) => {
        console.log('✅ Factura consultada:', response);
        
        // Simular respuesta si el backend no está disponible
        this.facturaConsultada = response || {
          empresa: this.getNombreEmpresa(),
          referencia: this.pagoData.numeroReferencia,
          periodo: this.pagoData.periodo || 'Diciembre 2024',
          fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
          monto: Math.floor(Math.random() * 200000) + 50000,
          vencida: false
        };

        // Cargar el monto automáticamente
        this.pagoData.monto = this.facturaConsultada.monto;
        this.consultando = false;
        this.mostrarMensaje('Factura consultada exitosamente.', 'success');
      },
      error: (error) => {
        console.error('❌ Error al consultar factura:', error);
        
        // Simular factura para demostración
        this.facturaConsultada = {
          empresa: this.getNombreEmpresa(),
          referencia: this.pagoData.numeroReferencia,
          periodo: this.pagoData.periodo || 'Diciembre 2024',
          fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          monto: Math.floor(Math.random() * 200000) + 50000,
          vencida: false
        };
        
        this.pagoData.monto = this.facturaConsultada.monto;
        this.consultando = false;
        this.mostrarMensaje('Factura consultada (modo demo).', 'success');
      }
    });
  }

  getNombreEmpresa(): string {
    const empresas = this.getEmpresasPorCategoria();
    const empresa = empresas.find(e => e.id === this.pagoData.empresa);
    return empresa ? empresa.nombre : 'Empresa seleccionada';
  }

  saldoSuficiente(): boolean {
    if (!this.pagoData.cuentaDebito || !this.pagoData.monto) {
      return true; // No validar si no hay datos completos
    }

    const cuenta = this.cuentasDisponibles.find(c => c.numeroCuenta === this.pagoData.cuentaDebito);
    if (!cuenta) return false;

    const totalAPagar = this.pagoData.monto + this.comision;
    return cuenta.saldo >= totalAPagar;
  }

  onSubmit() {
    if (this.isSubmitting) return;
    
    if (!this.validarFormulario()) {
      return;
    }

    this.isSubmitting = true;
    const apiUrl = 'http://localhost:8080/bank/PagarServicio';
    
    const datosEnviar = {
      clienteId: this.clienteId,
      categoria: this.categoriaSeleccionada,
      ...this.pagoData,
      comision: this.comision,
      totalPago: this.pagoData.monto + this.comision,
      fechaPago: this.pagoData.programado ? this.pagoData.fechaProgramada : new Date().toISOString(),
      estado: this.pagoData.programado ? 'PROGRAMADO' : 'PROCESADO'
    };

    console.log('📤 Enviando pago de servicio:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Pago procesado:', response);
        
        const tipoPago = this.pagoData.programado ? 'programado' : 'realizado';
        const numeroTransaccion = response?.numeroTransaccion || Math.floor(Math.random() * 1000000);
        
        this.mostrarMensaje(
          `¡Pago ${tipoPago} exitosamente! 🎉 Número de transacción: ${numeroTransaccion}. Total: $${(this.pagoData.monto + this.comision).toLocaleString()}`,
          'success'
        );
        
        this.isSubmitting = false;
        
        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          this.limpiarFormulario();
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al procesar pago:', error);
        this.mostrarMensaje('Error al procesar el pago. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.categoriaSeleccionada) {
      this.mostrarMensaje('Por favor seleccione una categoría de servicio.', 'error');
      return false;
    }

    if (!this.pagoData.empresa) {
      this.mostrarMensaje('Por favor seleccione la empresa o proveedor.', 'error');
      return false;
    }

    if (!this.pagoData.numeroReferencia || this.pagoData.numeroReferencia.trim().length < 3) {
      this.mostrarMensaje('Por favor ingrese un número de referencia válido.', 'error');
      return false;
    }

    if (!this.pagoData.monto || this.pagoData.monto < 1000) {
      this.mostrarMensaje('El monto mínimo de pago es $1,000.', 'error');
      return false;
    }

    if (!this.pagoData.cuentaDebito) {
      this.mostrarMensaje('Por favor seleccione una cuenta para el débito.', 'error');
      return false;
    }

    if (!this.saldoSuficiente()) {
      this.mostrarMensaje('Saldo insuficiente en la cuenta seleccionada.', 'error');
      return false;
    }

    if (this.pagoData.programado && !this.pagoData.fechaProgramada) {
      this.mostrarMensaje('Por favor seleccione la fecha para el pago programado.', 'error');
      return false;
    }

    // Validar fecha programada
    if (this.pagoData.programado) {
      const fechaSeleccionada = new Date(this.pagoData.fechaProgramada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada < hoy) {
        this.mostrarMensaje('La fecha programada no puede ser anterior a hoy.', 'error');
        return false;
      }
    }

    return true;
  }

  limpiarFormulario() {
    this.pagoData = {
      empresa: '',
      numeroReferencia: '',
      periodo: '',
      monto: 0,
      codigoConvenio: '',
      cuentaDebito: '',
      programado: false,
      fechaProgramada: '',
      recurrente: false
    };
    this.facturaConsultada = null;
    this.categoriaSeleccionada = '';
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
      this.mensajeTipo = '';
    }, 6000);
  }

  volver() {
    this.volverClick.emit();
  }

  abrirDetallePagoServicios(id: String) {
  this.irFormularioPAgoServicios.emit(id);
}
}