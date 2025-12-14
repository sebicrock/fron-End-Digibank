import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { LoginResponse } from "../model/login-response.model"; // ✅ importa el modelo

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private apiUrl = "https://digibank-backend.onrender.com/bank/createClient";
  private apiUrlCuentaAhorros = "http://localhost:8080/bank/createCuentaAhorros";
  private apiUrlLogin = "http://localhost:8080/bank/login"; // 🔹 define el endpoint del login

  constructor(private http: HttpClient) {}

  // 🔹 Crear cliente
  createClient(clientData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('📤 Data cliente enviada al backend:', clientData);
    return this.http.post(this.apiUrl, clientData, { headers });
  }

  // 🔹 Login usuario
  loginUser(credentials: { userName: string; password: string }): Observable<LoginResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('📤 Credenciales enviadas al backend:', credentials);

    // ✅ Indicamos que la respuesta será del tipo LoginResponse
    return this.http.post<LoginResponse>(this.apiUrlLogin, credentials, { headers });
  }

  // 🔹 Crear cuenta de ahorros
  crearCuentaAhorros(accountData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    console.log('📤 Data cuenta de ahorros enviada al backend:', accountData);
    return this.http.post(this.apiUrlCuentaAhorros, accountData, { headers });
  }
}
