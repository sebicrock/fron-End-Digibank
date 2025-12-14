import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

interface NotificationSettings {
  email: {
    transacciones: boolean;
    seguridad: boolean;
    promociones: boolean;
  };
  push: {
    movimientos: boolean;
    vencimientos: boolean;
  };
}

interface UserData {
  nombres: string;
  apellidos: string;
  email: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  pais: string;
  fotoPerfil: string;
  tipoCliente: string;
  puntosLealtad: number;
  fechaRegistro: string;
  ultimoCambioPassword: string;
  dobleAutenticacion: boolean;
  alertasSeguridad: boolean;
  idioma: string;
  moneda: string;
  zonaHoraria: string;
  tema: string;
  notificaciones: NotificationSettings;
}

interface PasswordData {
  actual: string;
  nueva: string;
  confirmar: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  tabActiva: string = 'informacion';
  modoEdicion: boolean = false;
  guardando: boolean = false;
  mostrarCambioPassword: boolean = false;
  
  mensaje: string = '';
  mensajeTipo: 'success' | 'error' = 'success';

  totalProductos: number = 3;

  userData: UserData = {
    nombres: 'Juan Carlos',
    apellidos: 'Rodríguez García',
    email: 'juan.rodriguez@email.com',
    tipoDocumento: 'CC',
    numeroDocumento: '1234567890',
    fechaNacimiento: '1990-05-15',
    genero: 'M',
    telefono: '3001234567',
    direccion: 'Calle 123 #45-67',
    ciudad: 'Bogotá',
    pais: 'CO',
    fotoPerfil: '',
    tipoCliente: 'Cliente Premium',
    puntosLealtad: 1250,
    fechaRegistro: '2020-01-15',
    ultimoCambioPassword: '2024-10-01',
    dobleAutenticacion: true,
    alertasSeguridad: true,
    idioma: 'es',
    moneda: 'COP',
    zonaHoraria: 'America/Bogota',
    tema: 'claro',
    notificaciones: {
      email: {
        transacciones: true,
        seguridad: true,
        promociones: false
      },
      push: {
        movimientos: true,
        vencimientos: true
      }
    }
  };

  userDataOriginal!: UserData;

  passwordData: PasswordData = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarDatosUsuario();
    this.copiarDatosOriginales();
  }

  cargarDatosUsuario(): void {
    // Aquí harías la llamada al servicio para obtener los datos del usuario
    // Ejemplo:
    // this.userService.obtenerPerfil().subscribe(data => {
    //   this.userData = data;
    //   this.copiarDatosOriginales();
    // });
    console.log('Datos del usuario cargados');
  }

  copiarDatosOriginales(): void {
    this.userDataOriginal = {
      ...this.userData,
      notificaciones: {
        email: { ...this.userData.notificaciones.email },
        push: { ...this.userData.notificaciones.push }
      }
    };
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  cambiarTab(tab: string): void {
    this.tabActiva = tab;
    if (this.modoEdicion) {
      this.cancelarEdicion();
    }
  }

  activarEdicion(): void {
    this.modoEdicion = true;
    this.copiarDatosOriginales();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.userData = {
      ...this.userDataOriginal,
      notificaciones: {
        email: { ...this.userDataOriginal.notificaciones.email },
        push: { ...this.userDataOriginal.notificaciones.push }
      }
    };
  }

  guardarCambios(): void {
    if (!this.validarDatos()) {
      return;
    }

    this.guardando = true;
    
    // Simulación de guardado - Aquí harías la llamada al servicio
    // this.userService.actualizarPerfil(this.userData).subscribe({
    //   next: (response) => {
    //     this.guardando = false;
    //     this.modoEdicion = false;
    //     this.copiarDatosOriginales();
    //     this.mostrarMensaje('Cambios guardados exitosamente', 'success');
    //   },
    //   error: (error) => {
    //     this.guardando = false;
    //     this.mostrarMensaje('Error al guardar los cambios', 'error');
    //   }
    // });

    setTimeout(() => {
      this.guardando = false;
      this.modoEdicion = false;
      this.copiarDatosOriginales();
      this.mostrarMensaje('Cambios guardados exitosamente', 'success');
    }, 1500);
  }

  validarDatos(): boolean {
    if (!this.userData.nombres || !this.userData.apellidos) {
      this.mostrarMensaje('Nombres y apellidos son obligatorios', 'error');
      return false;
    }
    
    if (!this.userData.email || !this.validarEmail(this.userData.email)) {
      this.mostrarMensaje('Email inválido', 'error');
      return false;
    }

    if (this.userData.telefono && !this.validarTelefono(this.userData.telefono)) {
      this.mostrarMensaje('Teléfono debe tener 10 dígitos', 'error');
      return false;
    }

    return true;
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validarTelefono(telefono: string): boolean {
    const regex = /^[0-9]{10}$/;
    return regex.test(telefono);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no debe superar 5MB', 'error');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.mostrarMensaje('Solo se permiten imágenes', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.userData.fotoPerfil = e.target.result as string;
          this.mostrarMensaje('Foto de perfil actualizada', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  calcularAntiguedad(): string {
    const fechaRegistro = new Date(this.userData.fechaRegistro);
    const hoy = new Date();
    const años = hoy.getFullYear() - fechaRegistro.getFullYear();
    const meses = hoy.getMonth() - fechaRegistro.getMonth();
    
    if (años === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
    
    return `${años} ${años === 1 ? 'año' : 'años'}`;
  }

  diasDesdeUltimoCambio(): number {
    const ultimoCambio = new Date(this.userData.ultimoCambioPassword);
    const hoy = new Date();
    const diferencia = hoy.getTime() - ultimoCambio.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  }

  cambiarPassword(): void {
    if (!this.passwordData.actual) {
      this.mostrarMensaje('Ingresa tu contraseña actual', 'error');
      return;
    }

    if (this.passwordData.nueva.length < 8) {
      this.mostrarMensaje('La nueva contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    if (this.passwordData.nueva !== this.passwordData.confirmar) {
      this.mostrarMensaje('Las contraseñas no coinciden', 'error');
      return;
    }

    // Simulación de cambio de contraseña - Aquí harías la llamada al servicio
    // this.authService.cambiarPassword(this.passwordData).subscribe({
    //   next: (response) => {
    //     this.userData.ultimoCambioPassword = new Date().toISOString().split('T')[0];
    //     this.passwordData = { actual: '', nueva: '', confirmar: '' };
    //     this.mostrarCambioPassword = false;
    //     this.mostrarMensaje('Contraseña actualizada exitosamente', 'success');
    //   },
    //   error: (error) => {
    //     this.mostrarMensaje('Error al cambiar la contraseña', 'error');
    //   }
    // });

    setTimeout(() => {
      this.userData.ultimoCambioPassword = new Date().toISOString().split('T')[0];
      this.passwordData = { actual: '', nueva: '', confirmar: '' };
      this.mostrarCambioPassword = false;
      this.mostrarMensaje('Contraseña actualizada exitosamente', 'success');
    }, 1000);
  }

  cancelarCambioPassword(): void {
    this.mostrarCambioPassword = false;
    this.passwordData = { actual: '', nueva: '', confirmar: '' };
  }

  toggleDobleAutenticacion(): void {
    this.userData.dobleAutenticacion = !this.userData.dobleAutenticacion;
    const estado = this.userData.dobleAutenticacion ? 'activada' : 'desactivada';
    
    // Aquí harías la llamada al servicio
    // this.securityService.toggle2FA(this.userData.dobleAutenticacion).subscribe();
    
    this.mostrarMensaje(`Autenticación en dos pasos ${estado}`, 'success');
  }

  guardarConfiguracion(): void {
    // Aquí harías la llamada al servicio
    // this.userService.actualizarConfiguracion(this.userData).subscribe();
    
    this.mostrarMensaje('Configuración de seguridad actualizada', 'success');
  }

  guardarPreferencias(): void {
    // Aquí harías la llamada al servicio
    // this.userService.actualizarPreferencias(this.userData).subscribe();
    
    this.mostrarMensaje('Preferencias guardadas', 'success');
  }

  guardarNotificaciones(): void {
    // Aquí harías la llamada al servicio
    // this.userService.actualizarNotificaciones(this.userData.notificaciones).subscribe();
    
    this.mostrarMensaje('Preferencias de notificaciones actualizadas', 'success');
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.mensajeTipo = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 3000);
  }
}