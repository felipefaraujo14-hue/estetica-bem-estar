
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configura a navegação entre as telas.
    provideRouter(routes),

    // Habilita as requisições HTTP para a API.
    provideHttpClient()
  ]
};
