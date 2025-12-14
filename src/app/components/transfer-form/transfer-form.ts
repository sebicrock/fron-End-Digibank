import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Cuenta {
  numeroCuenta: number;
  tipoCuenta: string;
  saldo: number;
}

interface TransferenciaRequest {
  numeroCuentaOrigen: number;
  numeroCuentaDestino: number;
  monto: number;
  descripcion?: string;
  tipoTransferencia: 'PROPIA' | 'TERCERO';
}

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './transfer-form.html',
  styleUrls: ['./transfer-form.css']
})
export class TransferForm implements OnInit {
  @Output() volverClick = new EventEmitter<void>();
  @Output() transferenciaExitosa = new EventEmitter<any>();

  // API URL - Ajusta según tu backend
  private apiUrl = 'http://localhost:8080/api';

  // Formulario
  transferForm!: FormGroup;

  // Cuentas
  cuentasOrigen: Cuenta[] = [];
  cuentaOrigenSeleccionada: Cuenta | null = null;
  cargandoCuentas = false;

  // Validación de cuenta destino
  validandoCuenta = false;
  cuentaDestinoValida = false;
  nombreDestinatario = '';

  // Estados
  procesando = false;
  mensajeExito = '';
  mensajeError = '';

  // Cliente ID
  clienteId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarClienteId();
    this.cargarCuentas();
  }

  inicializarFormulario(): void {
    this.transferForm = this.fb.group({
      tipoTransferencia: ['TERCERO', Validators.required],
      numeroCuentaDestino: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      monto: ['', [Validators.required, Validators.min(1000)]],
      descripcion: ['', Validators.maxLength(200)]
    });

    // Escuchar cambios en el tipo de transferencia
    this.transferForm.get('tipoTransferencia')?.valueChanges.subscribe(() => {
      this.resetearValidacionDestino();
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

  cargarCuentas(): void {
    if (!this.clienteId) {
      console.error('❌ No hay cliente ID para cargar cuentas');
      return;
    }

    this.cargandoCuentas = true;
    this.mensajeError = '';

    // Ajusta la URL según tu endpoint
    this.http.get<Cuenta[]>(`${this.apiUrl}/cuentas/cliente/${this.clienteId}`)
      .subscribe({
        next: (cuentas) => {
          this.cuentasOrigen = cuentas;
          console.log('✅ Cuentas cargadas:', cuentas);
          this.cargandoCuentas = false;

          // Actualizar validador de monto máximo si hay cuenta seleccionada
          if (this.cuentaOrigenSeleccionada) {
            this.actualizarValidadorMonto();
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar cuentas:', error);
          this.mensajeError = 'No se pudieron cargar tus cuentas. Por favor, intenta nuevamente.';
          this.cargandoCuentas = false;
        }
      });
  }

  seleccionarCuentaOrigen(cuenta: Cuenta): void {
    this.cuentaOrigenSeleccionada = cuenta;
    console.log('🏦 Cuenta origen seleccionada:', cuenta);
    this.actualizarValidadorMonto();
    this.resetearValidacionDestino();
  }

  actualizarValidadorMonto(): void {
    if (this.cuentaOrigenSeleccionada) {
      const montoControl = this.transferForm.get('monto');
      montoControl?.setValidators([
        Validators.required,
        Validators.min(1000),
        Validators.max(this.cuentaOrigenSeleccionada.saldo)
      ]);
      montoControl?.updateValueAndValidity();
    }
  }

  validarCuentaDestino(): void {
    const numeroCuentaDestino = this.transferForm.get('numeroCuentaDestino')?.value;

    if (!numeroCuentaDestino || !this.cuentaOrigenSeleccionada) {
      return;
    }

    // No permitir transferir a la misma cuenta
    if (Number(numeroCuentaDestino) === this.cuentaOrigenSeleccionada.numeroCuenta) {
      this.cuentaDestinoValida = false;
      this.mensajeError = 'No puedes transferir a la misma cuenta origen';
      return;
    }

    this.validandoCuenta = true;
    this.cuentaDestinoValida = false;
    this.mensajeError = '';

    // Ajusta la URL según tu endpoint
    this.http.get<any>(`${this.apiUrl}/cuentas/${numeroCuentaDestino}`)
      .subscribe({
        next: (cuenta) => {
          this.cuentaDestinoValida = true;
          // Asume que tu API retorna información del titular
          this.nombreDestinatario = cuenta.nombreTitular || 'Cuenta válida';
          console.log('✅ Cuenta destino válida:', cuenta);
          this.validandoCuenta = false;
        },
        error: (error) => {
          console.error('❌ Error al validar cuenta destino:', error);
          this.cuentaDestinoValida = false;
          this.mensajeError = 'La cuenta destino no existe o no es válida';
          this.validandoCuenta = false;
        }
      });
  }

  resetearValidacionDestino(): void {
    this.cuentaDestinoValida = false;
    this.nombreDestinatario = '';
    this.transferForm.get('numeroCuentaDestino')?.setValue('');
  }

  formatearMonto(event: Event): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, ''); // Remover no-dígitos
    
    if (valor) {
      // Formatear con separadores de miles
      valor = Number(valor).toLocaleString('es-CO');
    }
    
    input.value = valor;
    
    // Actualizar el valor real en el formulario (sin formato)
    const valorNumerico = input.value.replace(/\D/g, '');
    this.transferForm.get('monto')?.setValue(valorNumerico, { emitEvent: false });
  }

  obtenerMontoNumerico(): number {
    const montoStr = this.transferForm.get('monto')?.value;
    if (typeof montoStr === 'string') {
      return Number(montoStr.replace(/\D/g, ''));
    }
    return Number(montoStr) || 0;
  }

  realizarTransferencia(): void {
    if (this.transferForm.invalid || !this.cuentaDestinoValida || !this.cuentaOrigenSeleccionada) {
      return;
    }

    this.procesando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    const transferenciaData: TransferenciaRequest = {
      numeroCuentaOrigen: this.cuentaOrigenSeleccionada.numeroCuenta,
      numeroCuentaDestino: Number(this.transferForm.get('numeroCuentaDestino')?.value),
      monto: this.obtenerMontoNumerico(),
      tipoTransferencia: this.transferForm.get('tipoTransferencia')?.value,
      descripcion: this.transferForm.get('descripcion')?.value || undefined
    };

    console.log('💸 Enviando transferencia:', transferenciaData);

    // Ajusta la URL según tu endpoint
    this.http.post<any>(`${this.apiUrl}/transferencias`, transferenciaData)
      .subscribe({
        next: (response) => {
          console.log('✅ Transferencia exitosa:', response);
          this.mensajeExito = `Transferencia realizada exitosamente por ${this.formatearMoneda(transferenciaData.monto)}`;
          this.procesando = false;

          // Emitir evento de éxito
          this.transferenciaExitosa.emit(response);

          // Recargar cuentas para actualizar saldos
          this.cargarCuentas();

          // Resetear formulario después de 3 segundos
          setTimeout(() => {
            this.resetearFormulario();
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Error en transferencia:', error);
          this.mensajeError = error.error?.mensaje || 'Ocurrió un error al procesar la transferencia. Por favor, intenta nuevamente.';
          this.procesando = false;
        }
      });
  }

  resetearFormulario(): void {
    this.transferForm.reset({
      tipoTransferencia: 'TERCERO'
    });
    this.cuentaOrigenSeleccionada = null;
    this.cuentaDestinoValida = false;
    this.nombreDestinatario = '';
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  cancelar(): void {
    if (this.procesando) {
      return;
    }

    if (this.transferForm.dirty) {
      if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.')) {
        this.volver();
      }
    } else {
      this.volver();
    }
  }

  volver(): void {
    this.volverClick.emit();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }
}