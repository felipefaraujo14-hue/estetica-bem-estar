
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { appConfig } from './app/app.config';
import { App } from './app/app';

// Registra os formatos de data e números do português.
registerLocaleData(localePt, 'pt-BR');

// Inicializa a aplicação Angular com a configuração definida em appConfig.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
