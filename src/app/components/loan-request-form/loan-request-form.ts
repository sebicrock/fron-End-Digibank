import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-loan-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './loan-request-form.html',
  styleUrl: './loan-request-form.css',
})
export class LoanRequestForm implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irAPrestamo = new EventEmitter<number>();

  loanData = {
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    email: '',
    phone: '',
    loanAmount: 0,
    loanTerm: '',
    loanPurpose: '',
    employmentType: '',
    monthlyIncome: 0,
    companyName: '',
    timeInJob: '',
    accountType: '',
    accountNumber: '',
    bankName: '',
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
    acceptTerms: false
  };

  mensaje = '';
  mensajeTipo: 'success' | 'error' | '' = '';
  isSubmitting = false;
  clienteId: number = 0;
  
  // Cálculos del préstamo
  cuotaMensual: number = 0;
  tasaInteresMensual: number = 1.5; // Tasa por defecto
  totalIntereses: number = 0;
  totalAPagar: number = 0;

  // Tasas según destino del préstamo
  private tasasPorDestino: { [key: string]: number } = {
    'LIBRE_INVERSION': 1.5,
    'VEHICULO': 1.2,
    'VIVIENDA': 1.1,
    'EDUCACION': 1.0,
    'CONSOLIDACION': 1.6,
    'NEGOCIOS': 1.8,
    'SALUD': 1.3,
    'TURISMO': 1.7
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.clienteId = Number(localStorage.getItem('clienteId')) || 0;
    if (this.clienteId > 0) {
      this.cargarDatosCliente(this.clienteId);
    }
  }

  cargarDatosCliente(clienteId: number) {
    const apiUrl = `https://digibank-backend.onrender.com/bank/clientes/${clienteId}`;
    this.http.get<any>(apiUrl).subscribe({
      next: (cliente) => {
        this.loanData.firstName = cliente.fullNames || '';
        this.loanData.lastName = cliente.fullSurNames || '';
        this.loanData.documentType = cliente.documentType || '';
        this.loanData.documentNumber = cliente.documentNumber || '';
        this.loanData.email = cliente.email || '';
        this.loanData.phone = cliente.movilePhone || '';
        console.log('✅ Datos del cliente cargados:', cliente);
      },
      error: (error) => {
        console.error('❌ Error al cargar los datos del cliente:', error);
        this.mostrarMensaje('No se pudieron cargar los datos del cliente.', 'error');
      }
    });
  }

  actualizarTasaInteres() {
    if (this.loanData.loanPurpose) {
      this.tasaInteresMensual = this.tasasPorDestino[this.loanData.loanPurpose] || 1.5;
      this.calcularCuota();
    }
  }

  calcularCuota() {
    if (!this.loanData.loanAmount || !this.loanData.loanTerm || this.loanData.loanAmount < 1000000) {
      this.cuotaMensual = 0;
      this.totalIntereses = 0;
      this.totalAPagar = 0;
      return;
    }

    const principal = Number(this.loanData.loanAmount);
    const plazoMeses = Number(this.loanData.loanTerm);
    const tasaMensual = this.tasaInteresMensual / 100;

    // Fórmula de cuota fija (sistema francés)
    // Cuota = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
    const factorInteres = Math.pow(1 + tasaMensual, plazoMeses);
    this.cuotaMensual = Math.round(
      principal * (tasaMensual * factorInteres) / (factorInteres - 1)
    );

    this.totalAPagar = this.cuotaMensual * plazoMeses;
    this.totalIntereses = this.totalAPagar - principal;
  }

  onSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.mensaje = '';

    if (!this.validarFormulario()) {
      this.isSubmitting = false;
      return;
    }

    const apiUrl = 'https://digibank-backend.onrender.com/bank/createLoan';
    const datosEnviar = {
      clienteId: this.clienteId,
      ...this.loanData,
      monthlyPayment: this.cuotaMensual,
      interestRate: this.tasaInteresMensual,
      totalInterest: this.totalIntereses,
      totalAmount: this.totalAPagar,
      fechaSolicitud: new Date().toISOString(),
      estado: 'PENDIENTE_APROBACION',
      references: [
        {
          name: this.loanData.reference1Name,
          phone: this.loanData.reference1Phone,
          relationship: this.loanData.reference1Relationship
        },
        {
          name: this.loanData.reference2Name,
          phone: this.loanData.reference2Phone,
          relationship: this.loanData.reference2Relationship
        }
      ]
    };

    console.log('📤 Enviando solicitud de préstamo:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);

        if (response && response.loanId) {
          localStorage.setItem('nuevoPrestamo', JSON.stringify(response));
          this.irAPrestamo.emit(response.loanId);
        }

        this.mostrarMensaje(
          `¡Solicitud de préstamo enviada exitosamente! 🎉 Número de solicitud: ${response?.loanId || 'N/A'}. Recibirá una respuesta en 24-48 horas.`,
          'success'
        );

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error al crear solicitud de préstamo:', error);
        this.mostrarMensaje('Error al enviar la solicitud. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  validarFormulario(): boolean {
    // Validar datos personales
    if (!this.loanData.firstName || !this.loanData.lastName) {
      this.mostrarMensaje('Por favor complete nombres y apellidos.', 'error');
      return false;
    }

    if (!this.loanData.documentType || !this.loanData.documentNumber) {
      this.mostrarMensaje('Por favor complete el tipo y número de documento.', 'error');
      return false;
    }

    if (!this.loanData.email || !this.validarEmail(this.loanData.email)) {
      this.mostrarMensaje('Por favor ingrese un correo electrónico válido.', 'error');
      return false;
    }

    if (!this.loanData.phone || this.loanData.phone.toString().length !== 10) {
      this.mostrarMensaje('Por favor ingrese un número de teléfono válido de 10 dígitos.', 'error');
      return false;
    }

    // Validar información del préstamo
    if (!this.loanData.loanAmount || this.loanData.loanAmount < 1000000) {
      this.mostrarMensaje('El monto mínimo del préstamo es de $1,000,000 COP.', 'error');
      return false;
    }

    if (this.loanData.loanAmount > 100000000) {
      this.mostrarMensaje('El monto máximo del préstamo es de $100,000,000 COP.', 'error');
      return false;
    }

    if (!this.loanData.loanTerm) {
      this.mostrarMensaje('Por favor seleccione el plazo del préstamo.', 'error');
      return false;
    }

    if (!this.loanData.loanPurpose) {
      this.mostrarMensaje('Por favor seleccione el destino del préstamo.', 'error');
      return false;
    }

    // Validar información laboral
    if (!this.loanData.employmentType) {
      this.mostrarMensaje('Por favor seleccione su tipo de empleo.', 'error');
      return false;
    }

    if (!this.loanData.monthlyIncome || this.loanData.monthlyIncome < 1300000) {
      this.mostrarMensaje('Los ingresos mensuales deben ser al menos 1 SMMLV ($1,300,000).', 'error');
      return false;
    }

    if (!this.loanData.companyName || this.loanData.companyName.trim().length < 3) {
      this.mostrarMensaje('Por favor ingrese el nombre de su empresa o empleador.', 'error');
      return false;
    }

    if (!this.loanData.timeInJob) {
      this.mostrarMensaje('Por favor seleccione su antigüedad laboral.', 'error');
      return false;
    }

    // Validar capacidad de pago (cuota no debe superar el 40% del ingreso)
    const capacidadPago = this.loanData.monthlyIncome * 0.4;
    if (this.cuotaMensual > capacidadPago) {
      this.mostrarMensaje(
        `La cuota mensual ($${this.cuotaMensual.toLocaleString()}) supera el 40% de sus ingresos. Por favor reduzca el monto o aumente el plazo.`,
        'error'
      );
      return false;
    }

    // Validar cuenta de desembolso
    if (!this.loanData.accountType) {
      this.mostrarMensaje('Por favor seleccione el tipo de cuenta para desembolso.', 'error');
      return false;
    }

    if (!this.loanData.accountNumber || this.loanData.accountNumber.length < 10) {
      this.mostrarMensaje('Por favor ingrese un número de cuenta válido.', 'error');
      return false;
    }

    if (!this.loanData.bankName) {
      this.mostrarMensaje('Por favor seleccione el banco de la cuenta.', 'error');
      return false;
    }

    // Validar referencias
    if (!this.loanData.reference1Name || !this.loanData.reference1Phone || !this.loanData.reference1Relationship) {
      this.mostrarMensaje('Por favor complete todos los datos de la primera referencia personal.', 'error');
      return false;
    }

    if (!this.loanData.reference2Name || !this.loanData.reference2Phone || !this.loanData.reference2Relationship) {
      this.mostrarMensaje('Por favor complete todos los datos de la segunda referencia personal.', 'error');
      return false;
    }

    // Validar que los teléfonos de las referencias sean diferentes
    if (this.loanData.reference1Phone === this.loanData.reference2Phone) {
      this.mostrarMensaje('Las referencias personales deben tener teléfonos diferentes.', 'error');
      return false;
    }

    // Validar términos y condiciones
    if (!this.loanData.acceptTerms) {
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
    
    // Auto-ocultar mensaje después de 7 segundos (más tiempo para mensajes de préstamo)
    setTimeout(() => {
      this.mensaje = '';
      this.mensajeTipo = '';
    }, 7000);
  }

  volver() {
    this.volverClick.emit();
  }
}