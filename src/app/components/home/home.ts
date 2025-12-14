import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule], // mantener RouterModule si usas routerLink
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {

  isScrolled = false;
  showScrollTop = false;
  mobileMenuOpen = false;

  ngOnInit(): void {
    this.checkScroll();
  }

  /**
   * Detecta el scroll para cambiar estilos del header
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkScroll();
  }

  /**
   * Verifica la posición del scroll
   */
  checkScroll(): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scrollPosition > 50;
    this.showScrollTop = scrollPosition > 300;
  }

  /**
   * Toggle del menú móvil
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  /**
   * Scroll suave a una sección
   */
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 73;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      this.mobileMenuOpen = false;
    }
  }

  /**
   * Scroll al inicio de la página
   */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Cierra el menú móvil al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (this.mobileMenuOpen &&
        !mobileBtn?.contains(target) &&
        !navMenu?.contains(target)) {
      this.mobileMenuOpen = false;
    }
  }

  /**
   * Cierra el menú móvil con la tecla ESC
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    // Forzamos que sea KeyboardEvent
    const keyboardEvent = event as KeyboardEvent;
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

}
