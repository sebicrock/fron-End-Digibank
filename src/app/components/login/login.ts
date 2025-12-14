import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClientService } from '../../service/client.service';

// ✅ Interfaz para definir la estructura de la respuesta del login
interface LoginResponse {
  clienteId?: number;
  nombre?: string;
  userName?: string;
  role?: string;
  mensaje?: string;
  token?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginData = {
    userName: '',
    password: ''
  };

  mensaje: string = '';
  isError: boolean = false;
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * 
   * Maneja el proceso de inicio de sesión
   */
  onLogin(): void {
    // Limpiar mensajes previos
    this.mensaje = '';
    this.isError = false;
    this.isLoading = true;

    console.log('🔐 Intentando iniciar sesión con:', this.loginData.userName);

    this.clientService.loginUser(this.loginData).subscribe({
      next: (response: LoginResponse) => { // ✅ Se tipa la respuesta
        console.log('✅ Login exitoso:', response);

        // Guardar datos en localStorage
        if (response.clienteId) {
          localStorage.setItem('clienteId', String(response.clienteId));
        }
        if (response.nombre) {
          localStorage.setItem('nombre', response.nombre);
        }
        if (response.userName) {
          localStorage.setItem('userName', response.userName);
        }
        if (response.role) {
          localStorage.setItem('role', response.role);
        }
        if (response.mensaje) {
          localStorage.setItem('mensaje', response.mensaje);
        }

        // Guardar token si existe
        if (response.token) {
          localStorage.setItem('token', response.token);
        }

        this.isError = false;
        this.mensaje = `✅ ${response.mensaje || '¡Bienvenido!'} Redirigiendo...`;
        this.isLoading = false;

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/UserProfile']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error en el login:', error);
        this.isLoading = false;
        this.isError = true;

        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.mensaje = '⚠️ Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.mensaje = '❌ No se pudo conectar con el servidor. Verifique su conexión.';
        } else if (error.error && error.error.mensaje) {
          this.mensaje = `⚠️ ${error.error.mensaje}`;
        } else {
          this.mensaje = '❌ Error inesperado. Intente nuevamente.';
        }

        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          this.mensaje = '';
          this.isError = false;
        }, 5000);
      }
    });
  }

  /**
   * Limpia el formulario
   */
  clearForm(): void {
    this.loginData = {
      userName: '',
      password: ''
    };
    this.mensaje = '';
    this.isError = false;
    this.showPassword = false;
  }

  /**
   * Maneja el evento Enter en los campos
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.isFormValid()) {
      this.onLogin();
    }
  }

  /**
   * Valida si el formulario está completo
   */
  isFormValid(): boolean {
    return this.loginData.userName.trim() !== '' && 
           this.loginData.password.trim() !== '' &&
           !this.isLoading;
  }
}
