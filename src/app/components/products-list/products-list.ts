import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Producto {
  tipo: string;
  numero: string;
  nombre: string;
  estado: string;
  [key: string]: any;
}

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css',
})
export class ProductsList implements OnInit {

  @Output() volverClick = new EventEmitter<void>();
  @Output() verDetalleProducto = new EventEmitter<any>();

  clienteId: number = 0;
  searchTerm: string = '';
  filtroActivo: string = 'TODOS';
  isLoading: boolean = false;

  // Arrays de productos por tipo
  cuentas: any[] = [];
  ahorros: any[] = [];
  cdts: any[] = [];
  prestamos: any[] = [];
  tarjetas: any[] = [];

  // Productos combinados y filtrados
  todosLosProductos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.clienteId = Number(localStorage.getItem('clienteId')) || 0;
    if (this.clienteId > 0) {
      this.cargarProductos();
    }
  }

  cargarProductos() {
    this.isLoading = true;

    // Cargar todos los productos en paralelo
    const cuentasUrl = `http://localhost:8080/bank/cuentas/cliente/${this.clienteId}`;
    const ahorrosUrl = `http://localhost:8080/bank/ahorros/cliente/${this.clienteId}`;
    const cdtsUrl = `http://localhost:8080/bank/cdts/cliente/${this.clienteId}`;
    const prestamosUrl = `http://localhost:8080/bank/prestamos/cliente/${this.clienteId}`;
    const tarjetasUrl = `http://localhost:8080/bank/tarjetas/cliente/${this.clienteId}`;

    Promise.all([
      this.http.get<any[]>(cuentasUrl).toPromise().catch(() => []),
      this.http.get<any[]>(ahorrosUrl).toPromise().catch(() => []),
      this.http.get<any[]>(cdtsUrl).toPromise().catch(() => []),
      this.http.get<any[]>(prestamosUrl).toPromise().catch(() => []),
      this.http.get<any[]>(tarjetasUrl).toPromise().catch(() => [])
    ]).then(([cuentas, ahorros, cdts, prestamos, tarjetas]) => {
      // Procesar cuentas
      this.cuentas = (cuentas || []).map(c => ({
        tipo: 'CUENTA',
        numero: c.numeroCuenta || c.id,
        nombre: c.tipoCuenta || 'Cuenta de Ahorros',
        estado: c.estado || 'ACTIVA',
        saldo: c.saldo || 0,
        titular: c.titular || c.nombreTitular || 'Sin titular',
        fechaApertura: c.fechaApertura || new Date().toISOString(),
        tipoCuenta: c.tipoCuenta || 'Básica',
        tasaInteres: c.tasaInteres || 4.5,
        ...c
      }));

      // Procesar ahorros programados
      this.ahorros = (ahorros || []).map(a => ({
        tipo: 'AHORRO',
        numero: a.numeroAhorro || a.id,
        nombre: a.meta || 'Ahorro Programado',
        estado: a.estado || 'ACTIVO',
        meta: a.meta || 'Meta de ahorro',
        montoAcumulado: a.montoAcumulado || 0,
        montoObjetivo: a.montoObjetivo || 0,
        cuotaPeriodica: a.cuotaPeriodica || 0,
        frecuencia: a.frecuencia || 'MENSUAL',
        proximoDebito: a.proximoDebito || new Date().toISOString(),
        fechaVencimiento: a.fechaVencimiento || new Date().toISOString(),
        ...a
      }));

      // Procesar CDTs
      this.cdts = (cdts || []).map(c => ({
        tipo: 'CDT',
        numero: c.numeroCDT || c.id,
        nombre: 'CDT',
        estado: c.estado || 'ACTIVO',
        montoInicial: c.montoInicial || c.monto || 0,
        montoFinal: c.montoFinal || c.valorVencimiento || 0,
        tasaInteres: c.tasaInteres || 0,
        plazo: c.plazo || 0,
        fechaApertura: c.fechaApertura || new Date().toISOString(),
        fechaVencimiento: c.fechaVencimiento || new Date().toISOString(),
        interesesGenerados: c.interesesGenerados || 0,
        tipoCDT: c.tipoCDT || 'Tradicional',
        ...c
      }));

      // Procesar préstamos
      this.prestamos = (prestamos || []).map(p => ({
        tipo: 'PRESTAMO',
        numero: p.numeroPrestamo || p.id,
        nombre: 'Préstamo Personal',
        estado: p.estado || 'VIGENTE',
        montoOriginal: p.montoOriginal || p.monto || 0,
        saldoPendiente: p.saldoPendiente || 0,
        cuotaMensual: p.cuotaMensual || 0,
        cuotasPagadas: p.cuotasPagadas || 0,
        cuotasTotales: p.cuotasTotales || p.plazo || 0,
        proximoPago: p.proximoPago || new Date().toISOString(),
        tasaInteres: p.tasaInteres || 0,
        destino: p.destino || 'Libre inversión',
        ...p
      }));

      // Procesar tarjetas de crédito
      this.tarjetas = (tarjetas || []).map(t => ({
        tipo: 'TARJETA',
        numero: t.numeroTarjeta || t.id,
        nombre: 'Tarjeta de Crédito',
        estado: t.estado || 'ACTIVA',
        tipoTarjeta: t.tipoTarjeta || 'CLASICA',
        ultimos4Digitos: t.ultimos4Digitos || '0000',
        cupoTotal: t.cupoTotal || 0,
        cupoDisponible: t.cupoDisponible || 0,
        saldoTotal: t.saldoTotal || 0,
        pagoMinimo: t.pagoMinimo || 0,
        fechaCorte: t.fechaCorte || new Date().toISOString(),
        fechaLimitePago: t.fechaLimitePago || new Date().toISOString(),
        fechaVencimiento: t.fechaVencimiento || new Date().toISOString(),
        titular: t.titular || 'Titular',
        ...t
      }));

      // Combinar todos los productos
      this.todosLosProductos = [
        ...this.cuentas,
        ...this.ahorros,
        ...this.cdts,
        ...this.prestamos,
        ...this.tarjetas
      ];

      this.productosFiltrados = [...this.todosLosProductos];
      this.isLoading = false;

      console.log('✅ Productos cargados:', {
        cuentas: this.cuentas.length,
        ahorros: this.ahorros.length,
        cdts: this.cdts.length,
        prestamos: this.prestamos.length,
        tarjetas: this.tarjetas.length,
        total: this.todosLosProductos.length
      });
    }).catch(error => {
      console.error('❌ Error al cargar productos:', error);
      this.isLoading = false;
    });
  }

  cambiarFiltro(filtro: string) {
    this.filtroActivo = filtro;
    this.filtrarProductos();
  }

  filtrarProductos() {
    let productos = [...this.todosLosProductos];

    // Filtrar por tipo
    if (this.filtroActivo !== 'TODOS') {
      const tipoMap: { [key: string]: string } = {
        'CUENTAS': 'CUENTA',
        'AHORROS': 'AHORRO',
        'CDTS': 'CDT',
        'PRESTAMOS': 'PRESTAMO',
        'TARJETAS': 'TARJETA'
      };
      const tipoFiltro = tipoMap[this.filtroActivo];
      productos = productos.filter(p => p.tipo === tipoFiltro);
    }

    // Filtrar por búsqueda
  //  if (this.searchTerm && this.searchTerm.trim() !== '') {
 //     const termino = this.searchTerm.toLowerCase();
//      productos = productos.filter(p => 
 //       p.numero.toString().toLowerCase().includes(termino) ||
 //       p.nombre.toLowerCase().includes(termino) ||
  //      p.tipo.toLowerCase().includes(termino) ||
       // (p.titular && p.titular.toLowerCase().includes(termino)) ||
       // (p.meta && p.meta.toLowerCase().includes(termino)) ||
       // (p.destino && p.destino.toLowerCase().includes(termino))
  //    );
//    }

//    this.productosFiltrados = productos;
 
}

  getTotalProductos(): number {
    return this.todosLosProductos.length;
  }

  getProgreso(producto: any): number {
    if (producto.tipo === 'AHORRO') {
      return Math.round((producto.montoAcumulado / producto.montoObjetivo) * 100);
    }
    return 0;
  }

  getCupoDisponiblePorcentaje(producto: any): number {
    if (producto.tipo === 'TARJETA') {
      return Math.round((producto.cupoDisponible / producto.cupoTotal) * 100);
    }
    return 0;
  }

  getCupoUsadoPorcentaje(producto: any): number {
    if (producto.tipo === 'TARJETA') {
      const usado = producto.cupoTotal - producto.cupoDisponible;
      return Math.round((usado / producto.cupoTotal) * 100);
    }
    return 0;
  }

  getTipoNombre(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'CUENTA': 'Cuenta de Ahorros',
      'AHORRO': 'Ahorro Programado',
      'CDT': 'CDT',
      'PRESTAMO': 'Préstamo',
      'TARJETA': 'Tarjeta de Crédito'
    };
    return nombres[tipo] || tipo;
  }

  getIconPath(tipo: string): string {
    const paths: { [key: string]: string } = {
      'CUENTA': 'M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z',
      'AHORRO': 'M19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V9H19V19ZM19 7H5V5H19V7ZM7 11H12V16H7V11Z',
      'CDT': 'M9 11H7V13H9V11ZM13 11H11V13H13V11ZM17 11H15V13H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z',
      'PRESTAMO': 'M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z',
      'TARJETA': 'M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z'
    };
    return paths[tipo] || paths['CUENTA'];
  }

  getTextoBotonSecundario(tipo: string): string {
    const textos: { [key: string]: string } = {
      'CUENTA': 'Movimientos',
      'AHORRO': 'Modificar',
      'CDT': 'Renovar',
      'PRESTAMO': 'Pagar Cuota',
      'TARJETA': 'Bloquear'
    };
    return textos[tipo] || 'Opciones';
  }

  verDetalle(producto: Producto) {
    console.log('Ver detalle de:', producto);
    this.verDetalleProducto.emit(producto);
  }

  accionSecundaria(producto: Producto) {
    console.log('Acción secundaria para:', producto);
    switch (producto.tipo) {
      case 'CUENTA':
        this.verMovimientos(producto);
        break;
      case 'AHORRO':
        this.modificarAhorro(producto);
        break;
      case 'CDT':
        this.renovarCDT(producto);
        break;
      case 'PRESTAMO':
        this.pagarCuota(producto);
        break;
      case 'TARJETA':
        this.bloquearTarjeta(producto);
        break;
    }
  }

  verMovimientos(producto: any) {
    console.log('Ver movimientos de:', producto);
    // Implementar navegación a movimientos
  }

  modificarAhorro(producto: any) {
    console.log('Modificar ahorro:', producto);
    // Implementar modificación de ahorro
  }

  renovarCDT(producto: any) {
    console.log('Renovar CDT:', producto);
    // Implementar renovación de CDT
  }

  pagarCuota(producto: any) {
    console.log('Pagar cuota de préstamo:', producto);
    // Implementar pago de cuota
  }

  bloquearTarjeta(producto: any) {
    console.log('Bloquear tarjeta:', producto);
    // Implementar bloqueo de tarjeta
  }

  volver() {
    this.volverClick.emit();
  }
}