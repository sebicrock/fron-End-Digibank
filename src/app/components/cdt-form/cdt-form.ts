import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cdt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cdt-form.html',
  styleUrl: './cdt-form.css',
})
export class CdtForm implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irACDT = new EventEmitter<number>();

  cdtData = {
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    email: '',
    phone: '',
    cdtAmount: 0,
    cdtTerm: '',
    interestPayment: '',
    cdtType: '',
    sourceAccountType: '',
    sourceAccountNumber: '',
    sourceBankName: '',
    interestAccountType: '',
    interestAccountNumber: '',
    autoRenewal: false,
    emailNotifications: true,
    physicalCertificate: false,
    acceptTerms: false
  };

  mensaje = '';
  mensajeTipo: 'success' | 'error' | '' = '';
  isSubmitting = false;
  clienteId: number = 0;
  
  // Cálculos del CDT
  rendimientoTotal: number = 0;
  tasaEfectiva: number = 0;
  totalAlVencimiento: number = 0;
  usarMismaCuenta: boolean = true;

  // Tasas según plazo y tipo de CDT
  private tasasPorPlazo: { [key: string]: number } = {
    '30': 6.0,
    '60': 6.5,
    '90': 7.0,
    '180': 8.0,
    '360': 9.5,
    '540': 10.5,
    '720': 11.0,
    '1080': 12.0
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.clienteId = Number(localStorage.getItem('clienteId')) || 0;
    if (this.clienteId > 0) {
      this.cargarDatosCliente(this.clienteId);
    }
  }

  cargarDatosCliente(clienteId: number) {
    const apiUrl = `http://localhost:8080/bank/clientes/${clienteId}`;
    this.http.get<any>(apiUrl).subscribe({
      next: (cliente) => {
        this.cdtData.firstName = cliente.fullNames || '';
        this.cdtData.lastName = cliente.fullSurNames || '';
        this.cdtData.documentType = cliente.documentType || '';
        this.cdtData.documentNumber = cliente.documentNumber || '';
        this.cdtData.email = cliente.email || '';
        this.cdtData.phone = cliente.movilePhone || '';
        console.log('✅ Datos del cliente cargados:', cliente);
      },
      error: (error) => {
        console.error('❌ Error al cargar los datos del cliente:', error);
        this.mostrarMensaje('No se pudieron cargar los datos del cliente.', 'error');
      }
    });
  }

  calcularRendimiento() {
    if (!this.cdtData.cdtAmount || !this.cdtData.cdtTerm || this.cdtData.cdtAmount < 1000000) {
      this.rendimientoTotal = 0;
      this.totalAlVencimiento = 0;
      this.tasaEfectiva = 0;
      return;
    }

    const capital = Number(this.cdtData.cdtAmount);
    const plazo = Number(this.cdtData.cdtTerm);
    
    // Obtener tasa base según plazo
    let tasaBase = this.tasasPorPlazo[this.cdtData.cdtTerm] || 7.0;
    
    // Ajustar tasa según tipo de CDT
    if (this.cdtData.cdtType === 'CRECIENTE') {
      tasaBase += 0.5; // Bono de 0.5% para CDT creciente
    } else if (this.cdtData.cdtType === 'INFLACION') {
      tasaBase = 5.0 + 3.5; // IPC estimado + spread
    }

    // Ajustar tasa según forma de pago de intereses
    if (this.cdtData.interestPayment === 'MENSUAL') {
      tasaBase -= 0.3; // Reducción por pago anticipado
    } else if (this.cdtData.interestPayment === 'TRIMESTRAL') {
      tasaBase -= 0.2;
    } else if (this.cdtData.interestPayment === 'SEMESTRAL') {
      tasaBase -= 0.1;
    }

    this.tasaEfectiva = Math.round(tasaBase * 100) / 100;

    // Calcular rendimiento
    const tasaPeriodo = tasaBase / 100;
    const dias = plazo;
    const anios = dias / 360;

    if (this.cdtData.interestPayment === 'VENCIMIENTO') {
      // Interés compuesto
      this.totalAlVencimiento = Math.round(capital * Math.pow(1 + tasaPeriodo, anios));
      this.rendimientoTotal = this.totalAlVencimiento - capital;
    } else {
      // Interés simple (pagos periódicos)
      this.rendimientoTotal = Math.round(capital * tasaPeriodo * anios);
      this.totalAlVencimiento = capital + this.rendimientoTotal;
    }
  }

  getPlazoTexto(): string {
    const plazo = Number(this.cdtData.cdtTerm);
    if (plazo < 30) return '';
    if (plazo === 30) return '1 mes';
    if (plazo === 60) return '2 meses';
    if (plazo === 90) return '3 meses';
    if (plazo === 180) return '6 meses';
    if (plazo === 360) return '1 año';
    if (plazo === 540) return '1.5 años';
    if (plazo === 720) return '2 años';
    if (plazo === 1080) return '3 años';
    return `${Math.round(plazo / 30)} meses`;
  }

  cambiarCuentaIntereses() {
    if (this.usarMismaCuenta) {
      this.cdtData.interestAccountType = '';
      this.cdtData.interestAccountNumber = '';
    }
  }

  onSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.mensaje = '';

    if (!this.validarFormulario()) {
      this.isSubmitting = false;
      return;
    }

    const apiUrl = 'http://localhost:8080/bank/createCdts';
    
    // Si usa la misma cuenta, copiar datos
    if (this.usarMismaCuenta || this.cdtData.interestPayment === 'VENCIMIENTO') {
      this.cdtData.interestAccountType = this.cdtData.sourceAccountType;
      this.cdtData.interestAccountNumber = this.cdtData.sourceAccountNumber;
    }

    const datosEnviar = {
      clienteId: this.clienteId,
      ...this.cdtData,
      interestRate: this.tasaEfectiva,
      totalInterest: this.rendimientoTotal,
      maturityAmount: this.totalAlVencimiento,
      openingDate: new Date().toISOString(),
      maturityDate: this.calcularFechaVencimiento(),
      estado: 'ACTIVO'
    };

    console.log('📤 Enviando datos del CDT:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);

        if (response && response.cdtNumber) {
          localStorage.setItem('nuevoCDT', JSON.stringify(response));
          this.irACDT.emit(response.cdtNumber);
        }

        this.mostrarMensaje(
          `¡CDT constituido exitosamente! 🎉 Número de CDT: ${response?.cdtNumber || 'N/A'}. Rendimiento proyectado: $${this.rendimientoTotal.toLocaleString()} COP`,
          'success'
        );

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error al constituir CDT:', error);
        this.mostrarMensaje('Error al constituir el CDT. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  calcularFechaVencimiento(): string {
    const hoy = new Date();
    const diasPlazo = Number(this.cdtData.cdtTerm);
    const fechaVencimiento = new Date(hoy);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasPlazo);
    return fechaVencimiento.toISOString();
  }

  validarFormulario(): boolean {
    // Validar datos personales
    if (!this.cdtData.firstName || !this.cdtData.lastName) {
      this.mostrarMensaje('Por favor complete nombres y apellidos.', 'error');
      return false;
    }

    if (!this.cdtData.documentType || !this.cdtData.documentNumber) {
      this.mostrarMensaje('Por favor complete el tipo y número de documento.', 'error');
      return false;
    }

    if (!this.cdtData.email || !this.validarEmail(this.cdtData.email)) {
      this.mostrarMensaje('Por favor ingrese un correo electrónico válido.', 'error');
      return false;
    }

    if (!this.cdtData.phone || this.cdtData.phone.toString().length !== 10) {
      this.mostrarMensaje('Por favor ingrese un número de teléfono válido de 10 dígitos.', 'error');
      return false;
    }

    // Validar configuración del CDT
    if (!this.cdtData.cdtAmount || this.cdtData.cdtAmount < 1000000) {
      this.mostrarMensaje('El monto mínimo del CDT es de $1,000,000 COP.', 'error');
      return false;
    }

    if (!this.cdtData.cdtTerm) {
      this.mostrarMensaje('Por favor seleccione el plazo del CDT.', 'error');
      return false;
    }

    if (!this.cdtData.interestPayment) {
      this.mostrarMensaje('Por favor seleccione la forma de pago de intereses.', 'error');
      return false;
    }

    if (!this.cdtData.cdtType) {
      this.mostrarMensaje('Por favor seleccione el tipo de CDT.', 'error');
      return false;
    }

    // Validar cuenta de origen
    if (!this.cdtData.sourceAccountType) {
      this.mostrarMensaje('Por favor seleccione el tipo de cuenta de origen.', 'error');
      return false;
    }

    if (!this.cdtData.sourceAccountNumber || this.cdtData.sourceAccountNumber.length < 10) {
      this.mostrarMensaje('Por favor ingrese un número de cuenta válido.', 'error');
      return false;
    }

    if (!this.cdtData.sourceBankName) {
      this.mostrarMensaje('Por favor seleccione el banco de la cuenta de origen.', 'error');
      return false;
    }

    // Validar cuenta para intereses (si no es al vencimiento y no usa la misma cuenta)
    if (this.cdtData.interestPayment !== 'VENCIMIENTO' && !this.usarMismaCuenta) {
      if (!this.cdtData.interestAccountType || !this.cdtData.interestAccountNumber) {
        this.mostrarMensaje('Por favor complete los datos de la cuenta para pago de intereses.', 'error');
        return false;
      }
      
      if (this.cdtData.interestAccountNumber.length < 10) {
        this.mostrarMensaje('El número de cuenta para intereses debe ser válido.', 'error');
        return false;
      }
    }

    // Validar términos y condiciones
    if (!this.cdtData.acceptTerms) {
      this.mostrarMensaje('Debe aceptar los términos y condiciones para continuar.', 'error');
      return false;
    }

    return true;
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    
    // Auto-ocultar mensaje después de 6 segundos
    setTimeout(() => {
      this.mensaje = '';
      this.mensajeTipo = '';
    }, 6000);
  }

  volver() {
    this.volverClick.emit();
  }
}