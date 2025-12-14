import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-credit-card-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './credit-card-form.html',
  styleUrl: './credit-card-form.css',
})
export class CreditCardForm implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irATarjeta = new EventEmitter<number>();

  cardData = {
    firstName: '',
    lastName: '',
    documentType: '',
    documentNumber: '',
    birthDate: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    maritalStatus: '',
    cardType: '',
    employmentType: '',
    occupation: '',
    companyName: '',
    timeInJob: '',
    monthlyIncome: 0,
    monthlyExpenses: 0,
    hasCreditCards: '',
    totalCreditLimit: 0,
    hasLoans: '',
    monthlyLoanPayment: 0,
    bankReference: '',
    referenceName: '',
    referencePhone: '',
    referenceRelationship: '',
    cardDesign: 'ESTANDAR',
    deliveryAddress: 'RESIDENCIA',
    emailNotifications: true,
    smsNotifications: true,
    digitalCard: false,
    acceptTerms: false
  };

  mensaje = '';
  mensajeTipo: 'success' | 'error' | '' = '';
  isSubmitting = false;
  clienteId: number = 0;
  
  // Cálculos
  cupoEstimado: number = 0;
  maxBirthDate: string = '';

  // Configuración de cupos por tipo de tarjeta
  private cuposPorTipo: { [key: string]: { min: number, max: number } } = {
    'CLASICA': { min: 500000, max: 5000000 },
    'ORO': { min: 2000000, max: 15000000 },
    'PLATINUM': { min: 5000000, max: 50000000 }
  };

  constructor(private http: HttpClient) {
    // Calcular fecha máxima (18 años atrás)
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxBirthDate = today.toISOString().split('T')[0];
  }

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
        this.cardData.firstName = cliente.fullNames || '';
        this.cardData.lastName = cliente.fullSurNames || '';
        this.cardData.documentType = cliente.documentType || '';
        this.cardData.documentNumber = cliente.documentNumber || '';
        this.cardData.birthDate = cliente.birthDate || '';
        this.cardData.gender = cliente.gender || '';
        this.cardData.email = cliente.email || '';
        this.cardData.phone = cliente.movilePhone || '';
        this.cardData.address = cliente.address || '';
        this.cardData.city = cliente.city || '';
        console.log('✅ Datos del cliente cargados:', cliente);
      },
      error: (error) => {
        console.error('❌ Error al cargar los datos del cliente:', error);
        this.mostrarMensaje('No se pudieron cargar los datos del cliente.', 'error');
      }
    });
  }

  calcularCupoEstimado() {
    if (!this.cardData.monthlyIncome || !this.cardData.cardType || this.cardData.monthlyIncome < 1300000) {
      this.cupoEstimado = 0;
      return;
    }

    const ingreso = Number(this.cardData.monthlyIncome);
    const gastos = Number(this.cardData.monthlyExpenses) || 0;
    const cuotasPrestamos = Number(this.cardData.monthlyLoanPayment) || 0;
    
    // Calcular capacidad de endeudamiento (40% del ingreso neto)
    const ingresoNeto = ingreso - gastos - cuotasPrestamos;
    const capacidadMensual = ingresoNeto * 0.4;
    
    // Estimar cupo basado en capacidad de pago mensual
    // Asumiendo tasa promedio de 2% mensual y pago mínimo del 5%
    let cupoBase = capacidadMensual * 20; // Aproximadamente 20 veces la capacidad mensual
    
    // Ajustar por tipo de tarjeta
    const limites = this.cuposPorTipo[this.cardData.cardType];
    if (limites) {
      // Aplicar multiplicador según el tipo
      if (this.cardData.cardType === 'CLASICA') {
        cupoBase = Math.min(cupoBase, limites.max);
      } else if (this.cardData.cardType === 'ORO') {
        cupoBase = cupoBase * 1.5;
        cupoBase = Math.min(cupoBase, limites.max);
      } else if (this.cardData.cardType === 'PLATINUM') {
        cupoBase = cupoBase * 2;
        cupoBase = Math.min(cupoBase, limites.max);
      }
      
      // Asegurar que esté dentro de los límites
      cupoBase = Math.max(cupoBase, limites.min);
      cupoBase = Math.min(cupoBase, limites.max);
    }
    
    // Ajustar por antigüedad laboral
    if (this.cardData.timeInJob === '0-6') {
      cupoBase *= 0.7;
    } else if (this.cardData.timeInJob === '60+') {
      cupoBase *= 1.2;
    }
    
    // Ajustar si tiene otras tarjetas
    if (this.cardData.hasCreditCards === 'SI' && this.cardData.totalCreditLimit > 0) {
      // Reducir ligeramente si ya tiene mucho cupo en otras tarjetas
      const factorReduccion = 1 - (this.cardData.totalCreditLimit / (ingreso * 12)) * 0.1;
      cupoBase *= Math.max(factorReduccion, 0.8);
    }
    
    // Redondear a múltiplos de 100,000
    this.cupoEstimado = Math.round(cupoBase / 100000) * 100000;
  }

  onSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.mensaje = '';

    if (!this.validarFormulario()) {
      this.isSubmitting = false;
      return;
    }

    const apiUrl = 'http://localhost:8080/bank/createCreditCard';
    
    const datosEnviar = {
      clienteId: this.clienteId,
      ...this.cardData,
      estimatedCreditLimit: this.cupoEstimado,
      fechaSolicitud: new Date().toISOString(),
      estado: 'PENDIENTE_APROBACION',
      reference: {
        name: this.cardData.referenceName,
        phone: this.cardData.referencePhone,
        relationship: this.cardData.referenceRelationship
      }
    };

    console.log('📤 Enviando solicitud de tarjeta de crédito:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);

        if (response && response.cardRequestId) {
          localStorage.setItem('nuevaTarjeta', JSON.stringify(response));
          this.irATarjeta.emit(response.cardRequestId);
        }

        this.mostrarMensaje(
          `¡Solicitud de tarjeta de crédito enviada exitosamente! 🎉 Número de solicitud: ${response?.cardRequestId || 'N/A'}. Tu cupo estimado es de $${this.cupoEstimado.toLocaleString()}. Recibirás respuesta en 24-48 horas.`,
          'success'
        );

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error al solicitar tarjeta:', error);
        this.mostrarMensaje('Error al enviar la solicitud. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  validarFormulario(): boolean {
    // Validar datos personales
    if (!this.cardData.firstName || !this.cardData.lastName) {
      this.mostrarMensaje('Por favor complete nombres y apellidos.', 'error');
      return false;
    }

    if (!this.cardData.documentType || !this.cardData.documentNumber) {
      this.mostrarMensaje('Por favor complete el tipo y número de documento.', 'error');
      return false;
    }

    if (!this.cardData.birthDate) {
      this.mostrarMensaje('Por favor ingrese su fecha de nacimiento.', 'error');
      return false;
    }

    // Validar edad mínima (18 años)
    const birthDate = new Date(this.cardData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      this.mostrarMensaje('Debes ser mayor de 18 años para solicitar una tarjeta de crédito.', 'error');
      return false;
    }

    if (!this.cardData.gender) {
      this.mostrarMensaje('Por favor seleccione su género.', 'error');
      return false;
    }

    if (!this.cardData.email || !this.validarEmail(this.cardData.email)) {
      this.mostrarMensaje('Por favor ingrese un correo electrónico válido.', 'error');
      return false;
    }

    if (!this.cardData.phone || this.cardData.phone.toString().length !== 10) {
      this.mostrarMensaje('Por favor ingrese un número de teléfono válido de 10 dígitos.', 'error');
      return false;
    }

    if (!this.cardData.address || this.cardData.address.trim().length < 5) {
      this.mostrarMensaje('Por favor ingrese una dirección válida.', 'error');
      return false;
    }

    if (!this.cardData.city || this.cardData.city.trim().length < 3) {
      this.mostrarMensaje('Por favor ingrese una ciudad válida.', 'error');
      return false;
    }

    if (!this.cardData.maritalStatus) {
      this.mostrarMensaje('Por favor seleccione su estado civil.', 'error');
      return false;
    }

    // Validar tipo de tarjeta
    if (!this.cardData.cardType) {
      this.mostrarMensaje('Por favor seleccione el tipo de tarjeta que desea.', 'error');
      return false;
    }

    // Validar información laboral
    if (!this.cardData.employmentType) {
      this.mostrarMensaje('Por favor seleccione su tipo de empleo.', 'error');
      return false;
    }

    if (!this.cardData.occupation || this.cardData.occupation.trim().length < 3) {
      this.mostrarMensaje('Por favor ingrese su ocupación o profesión.', 'error');
      return false;
    }

    if (!this.cardData.companyName || this.cardData.companyName.trim().length < 3) {
      this.mostrarMensaje('Por favor ingrese el nombre de su empresa o empleador.', 'error');
      return false;
    }

    if (!this.cardData.timeInJob) {
      this.mostrarMensaje('Por favor seleccione su antigüedad laboral.', 'error');
      return false;
    }

    if (!this.cardData.monthlyIncome || this.cardData.monthlyIncome < 1300000) {
      this.mostrarMensaje('Los ingresos mensuales deben ser al menos 1 SMMLV ($1,300,000).', 'error');
      return false;
    }

    if (!this.cardData.monthlyExpenses || this.cardData.monthlyExpenses < 0) {
      this.mostrarMensaje('Por favor ingrese sus gastos mensuales aproximados.', 'error');
      return false;
    }

    // Validar que los gastos no superen los ingresos
    if (this.cardData.monthlyExpenses >= this.cardData.monthlyIncome) {
      this.mostrarMensaje('Los gastos mensuales no pueden ser iguales o superiores a los ingresos.', 'error');
      return false;
    }

    // Validar información financiera
    if (!this.cardData.hasCreditCards) {
      this.mostrarMensaje('Por favor indique si tiene otras tarjetas de crédito.', 'error');
      return false;
    }

    if (!this.cardData.hasLoans) {
      this.mostrarMensaje('Por favor indique si tiene créditos activos.', 'error');
      return false;
    }

    if (!this.cardData.bankReference) {
      this.mostrarMensaje('Por favor seleccione su banco de referencia.', 'error');
      return false;
    }

    // Validar capacidad de pago
    const ingresoDisponible = this.cardData.monthlyIncome - this.cardData.monthlyExpenses - (this.cardData.monthlyLoanPayment || 0);
    if (ingresoDisponible < 500000) {
      this.mostrarMensaje('El ingreso disponible después de gastos y obligaciones es insuficiente para aprobar una tarjeta de crédito.', 'error');
      return false;
    }

    // Validar referencia
    if (!this.cardData.referenceName || this.cardData.referenceName.trim().length < 5) {
      this.mostrarMensaje('Por favor ingrese el nombre completo de su referencia personal.', 'error');
      return false;
    }

    if (!this.cardData.referencePhone || this.cardData.referencePhone.toString().length !== 10) {
      this.mostrarMensaje('Por favor ingrese un teléfono válido de la referencia (10 dígitos).', 'error');
      return false;
    }

    // Validar que el teléfono de referencia sea diferente al del solicitante
    if (this.cardData.referencePhone === this.cardData.phone) {
      this.mostrarMensaje('El teléfono de la referencia debe ser diferente al suyo.', 'error');
      return false;
    }

    if (!this.cardData.referenceRelationship || this.cardData.referenceRelationship.trim().length < 3) {
      this.mostrarMensaje('Por favor especifique la relación con su referencia personal.', 'error');
      return false;
    }

    // Validar términos y condiciones
    if (!this.cardData.acceptTerms) {
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
    
    // Auto-ocultar mensaje después de 8 segundos
    setTimeout(() => {
      this.mensaje = '';
      this.mensajeTipo = '';
    }, 8000);
  }

  volver() {
    this.volverClick.emit();
  }
}