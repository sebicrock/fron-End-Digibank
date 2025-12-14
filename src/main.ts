import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { provideRouter } from '@angular/router'; // ✅ IMPORTANTE
import { routes } from './app/app.routes'; // ✅ IMPORTANTE

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(FormsModule, HttpClientModule),
    provideRouter(routes) // ✅ Aquí se activan tus rutas
  ]
}).catch(err => console.error(err));
