import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-demand-savings-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './demand-savings-form.html',
  styleUrl: './demand-savings-form.css',
}) 
export class DemandSavingsForm implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() irACuenta = new EventEmitter<number>();

  accountData = {
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
    department: '',
    type: '',
    initialDeposit: 0,
    includeDebitCard: false,
    emailNotifications: true,
    smsNotifications: false,
    acceptTerms: false
  };

  mensaje = '';
  mensajeTipo: 'success' | 'error' | '' = '';
  isSubmitting = false;
  clienteId: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.clienteId = Number(localStorage.getItem('clienteId')) || 0;
    if (this.clienteId > 0) { this.cargarDatosCliente(this.clienteId); }
  }

  cargarDatosCliente(clienteId: number) {
    const apiUrl = `http://localhost:8080/bank/clientes/${clienteId}`;
    this.http.get<any>(apiUrl).subscribe({
      next: (cliente) => {
        this.accountData.firstName = cliente.fullNames || '';
        this.accountData.lastName = cliente.fullSurNames || '';
        this.accountData.documentType = cliente.documentType || '';
        this.accountData.documentNumber = cliente.documentNumber || '';
        this.accountData.birthDate = cliente.birthDate || '';
        this.accountData.gender = cliente.gender || '';
        this.accountData.email = cliente.email || '';
        this.accountData.phone = cliente.movilePhone || '';
        this.accountData.address = cliente.address || '';
        this.accountData.city = cliente.city || '';
        this.accountData.department = cliente.department || '';
        console.log('✅ Datos del cliente cargados:', cliente);
      },
      error: (error) => {
        console.error('❌ Error al cargar los datos del cliente:', error);
        this.mostrarMensaje('No se pudieron cargar los datos del cliente.', 'error');
      }
    });
  }

  onSubmit() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.mensaje = '';

    if (!this.validarFormulario()) {
      this.isSubmitting = false;
      return;
    }

    const apiUrl = 'http://localhost:8080/bank/CreateAccount';
    const datosEnviar = {
      clienteId: this.clienteId,
      ...this.accountData,
      fechaSolicitud: new Date().toISOString(),
      estado: 'PENDIENTE'
    };

    console.log('📤 Enviando datos al backend:', datosEnviar);

    this.http.post<any>(apiUrl, datosEnviar).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);

        if (response && response.numberAccount) {
          // Guardar la respuesta (si quieres reusar)
          localStorage.setItem('nuevaCuenta', JSON.stringify(response));
          // Emitir el número al padre
          this.irACuenta.emit(response.numberAccount);
        }

        this.mostrarMensaje(
          `${response?.mensaje || 'Cuenta creada'}! 🎉 Cuenta N° ${response?.numberAccount || ''} a nombre de ${response?.name || ''}`,
          'success'
        );

        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Error al crear cuenta:', error);
        this.mostrarMensaje('Error al crear la cuenta. Por favor intente nuevamente.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.accountData.firstName || !this.accountData.lastName) {
      this.mostrarMensaje('Por favor complete nombres y apellidos.', 'error');
      return false;
    }
    if (!this.accountData.documentType || !this.accountData.documentNumber) {
      this.mostrarMensaje('Por favor complete el tipo y número de documento.', 'error');
      return false;
    }
    if (!this.accountData.email || !this.validarEmail(this.accountData.email)) {
      this.mostrarMensaje('Por favor ingrese un correo electrónico válido.', 'error');
      return false;
    }
    if (!this.accountData.phone || this.accountData.phone.toString().length < 10) {
      this.mostrarMensaje('Por favor ingrese un número de teléfono válido.', 'error');
      return false;
    }
    if (!this.accountData.type) {
      this.mostrarMensaje('Por favor seleccione un tipo de cuenta.', 'error');
      return false;
    }
    if (!this.accountData.initialDeposit || this.accountData.initialDeposit < 50000) {
      this.mostrarMensaje('El depósito inicial mínimo es de $50,000 COP.', 'error');
      return false;
    }
    if (!this.accountData.acceptTerms) {
      this.mostrarMensaje('Debe aceptar los términos y condiciones.', 'error');
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
    setTimeout(() => { this.mensaje = ''; this.mensajeTipo = ''; }, 5000);
  }

  volver() { this.volverClick.emit(); }



}
