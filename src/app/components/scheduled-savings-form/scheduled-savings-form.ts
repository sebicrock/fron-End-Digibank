import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-scheduled-savings-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './scheduled-savings-form.html',
  styleUrl: './scheduled-savings-form.css',
})
export class ScheduledSavingsForm implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irACuenta = new EventEmitter<number>();

  savingsData = {
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    savingsGoal: '',
    targetAmount: 0,
    termMonths: '',
    frequency: '',
    startDate: '',
    debitAccountType: '',
    debitAccountNumber: '',
    bankName: '',
    debitDay: '',
    emailNotifications: true,
    smsNotifications: false,
    goalReminders: true,
    acceptTerms: false
  };

  mensaje = '';
  mensajeTipo: 'success' | 'error' | '' = '';
  isSubmitting = false;
  clienteId: number = 0;
  
  // Cálculos del plan
  pagoCalculado: number = 0;
  tasaInteres: number = 6.5;
  interesEstimado: number = 0;
  totalConIntereses: number = 0;
  minDate: string = '';

  constructor(private http: HttpClient) {
    // Establecer fecha mínima (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
  }

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
        this.savingsData.firstName = cliente.fullNames || '';
        this.savingsData.lastName = cliente.fullSurNames || '';
        this.savingsData.documentType = cliente.documentType || '';
        this.savingsData.documentNumber = cliente.documentNumber || '';
        console.log('✅ Datos del cliente cargados:', cliente);
      },
      error: (error) => {
        console.error('❌ Error al cargar los datos del cliente:', error);
        this.mostrarMensaje('No se pudieron cargar los datos del cliente.', 'error');
      }
    });
  }

  calcularPago() {
    if (!this.savingsData.targetAmount || !this.savingsData.termMonths || !this.savingsData.frequency) {
      this.pagoCalculado = 0;
      return;
    }

    const monto = Number(this.savingsData.targetAmount);
    const meses = Number(this.savingsData.termMonths);
    const numPagos = this.getNumPagos();

    if (numPagos > 0) {
      this.pagoCalculado = Math.round(monto / numPagos);
      
      // Calcular interés estimado
      const tasaMensual = this.tasaInteres / 100 / 12;
      let totalAcumulado = 0;
      
      for (let i = 0; i < numPagos; i++) {
        totalAcumulado += this.pagoCalculado;
        const mesesRestantes = meses - (i * this.getPeriodoEnMeses());
        totalAcumulado += totalAcumulado * tasaMensual * mesesRestantes;
      }
      
      this.interesEstimado = Math.round(totalAcumulado - monto);
      this.totalConIntereses = Math.round(monto + this.interesEstimado);
    }
  }

  getNumPagos(): number {
    if (!this.savingsData.termMonths || !this.savingsData.frequency) return 0;
    
    const meses = Number(this.savingsData.termMonths);
    
    switch (this.savingsData.frequency) {
      case 'SEMANAL':
        return Math.round(meses * 4.33); // aprox 4.33 semanas por mes
      case 'QUINCENAL':
        return meses * 2;
      case 'MENSUAL':
        return meses;
      default:
        return 0;
    }
  }

  getPeriodoEnMeses(): number {
    switch (this.savingsData.frequency) {
      case 'SEMANAL':
        return 0.23; // aprox 1/4.33
      case 'QUINCENAL':
        return 0.5;
      case 'MENSUAL':
        return 1;
      default:
        return 0;
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

    const apiUrl = 'https://digibank-backend.onrender.com/bank/clientes/createScheduledSavings';
    const datosEnviar = {
      clienteId: this.clienteId,
      ...this.savingsData,
      calculatedPayment: this.pagoCalculado,
      numberOfPayments: this.getNumPagos(),
      estimatedInterest: this.interesEstimado,
      totalWithInterest: this.totalConIntereses,
      interestRate: this.tasaInteres,
      fechaSolicitud: new Date().toISOString(),
      estado: 'ACTIVO'
    };

    console.log('📤 Enviando datos del ahorro programado:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);

        if (response && response.savingsId) {
          localStorage.setItem('nuevoAhorroProgramado', JSON.stringify(response));
          this.irACuenta.emit(response.savingsId);
        }

        this.mostrarMensaje(
          `¡Ahorro programado creado exitosamente! 🎉 Meta: ${this.savingsData.savingsGoal}`,
          'success'
        );

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error al crear ahorro programado:', error);
        this.mostrarMensaje('Error al crear el ahorro programado. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.savingsData.firstName || !this.savingsData.lastName) {
      this.mostrarMensaje('Por favor complete nombres y apellidos.', 'error');
      return false;
    }

    if (!this.savingsData.documentType || !this.savingsData.documentNumber) {
      this.mostrarMensaje('Por favor complete el tipo y número de documento.', 'error');
      return false;
    }

    if (!this.savingsData.savingsGoal || this.savingsData.savingsGoal.trim().length < 3) {
      this.mostrarMensaje('Por favor defina una meta de ahorro válida.', 'error');
      return false;
    }

    if (!this.savingsData.targetAmount || this.savingsData.targetAmount < 100000) {
      this.mostrarMensaje('El monto objetivo mínimo es de $100,000 COP.', 'error');
      return false;
    }

    if (!this.savingsData.termMonths) {
      this.mostrarMensaje('Por favor seleccione el plazo del ahorro.', 'error');
      return false;
    }

    if (!this.savingsData.frequency) {
      this.mostrarMensaje('Por favor seleccione la frecuencia de ahorro.', 'error');
      return false;
    }

    if (!this.savingsData.startDate) {
      this.mostrarMensaje('Por favor seleccione la fecha de inicio.', 'error');
      return false;
    }

    // Validar fecha de inicio
    const fechaSeleccionada = new Date(this.savingsData.startDate);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada <= hoy) {
      this.mostrarMensaje('La fecha de inicio debe ser posterior a hoy.', 'error');
      return false;
    }

    if (!this.savingsData.debitAccountType) {
      this.mostrarMensaje('Por favor seleccione el tipo de cuenta de débito.', 'error');
      return false;
    }

    if (!this.savingsData.debitAccountNumber || this.savingsData.debitAccountNumber.length < 10) {
      this.mostrarMensaje('Por favor ingrese un número de cuenta válido.', 'error');
      return false;
    }

    if (!this.savingsData.bankName) {
      this.mostrarMensaje('Por favor seleccione el banco.', 'error');
      return false;
    }

    if (!this.savingsData.debitDay) {
      this.mostrarMensaje('Por favor seleccione el día de débito.', 'error');
      return false;
    }

    if (!this.savingsData.acceptTerms) {
      this.mostrarMensaje('Debe aceptar los términos y condiciones.', 'error');
      return false;
    }

    return true;
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    
    // Auto-ocultar mensaje después de 5 segundos
    setTimeout(() => {
      this.mensaje = '';
      this.mensajeTipo = '';
    }, 5000);
  }

  volver() {
    this.volverClick.emit();
  }
}