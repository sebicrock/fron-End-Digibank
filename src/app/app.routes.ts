import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login'
import { ClientForm } from './components/create-client/create-client';
import { UserProfile } from './components/user-profile/user-profile';
import { DemandSavingsForm } from './components/demand-savings-form/demand-savings-form'
import { ScheduledSavingsForm } from './components/scheduled-savings-form/scheduled-savings-form';
import { LoanRequestForm } from './components/loan-request-form/loan-request-form';

export const routes: Routes = [

    // ruta principal
    {path:'', redirectTo:'/home', pathMatch:'full'},

    // rutas de la aplicacion
    {path:'home', component: Home },
    {path: 'login', component: Login},
    {path: 'clientForm', component: ClientForm},
    {path: 'UserProfile', component: UserProfile,
        children:   [
      { path: '', redirectTo: 'crear-ahorro', pathMatch: 'full' }, // redirección por defecto
      { path: 'DemandSavingsForm', component: DemandSavingsForm },
      { path: 'ScheduledSavingsForm', component: ScheduledSavingsForm},
      { path: 'LoanRequestForm', component: LoanRequestForm }
        ]
    },


    {path:'**', redirectTo:'/home'}

];
