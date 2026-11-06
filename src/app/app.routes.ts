import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { Catalogo } from './pages/catalogo/catalogo';
import { Carrinho } from './pages/carrinho/carrinho';
import { FinalizarPedido } from './pages/finalizar-pedido/finalizar-pedido';
import { ConsultarPedidos } from './pages/consultar-pedidos/consultar-pedidos';

import { Admin } from './pages/admin/admin';
import { Inicio } from './pages/inicio/inicio';
import { Clientes } from './pages/clientes/clientes';
import { Funcionarios } from './pages/funcionarios/funcionarios';
import { Produtos } from './pages/produtos/produtos';
import { Servicos } from './pages/servicos/servicos';
import { Categorias } from './pages/categorias/categorias';
import { Entradas } from './pages/entradas/entradas';
import { Estoque } from './pages/estoque/estoque';
import { Atendimentos } from './pages/atendimentos/atendimentos';
import { MeusPedidos } from './pages/meus-pedidos/meus-pedidos';

export const routes: Routes = [
  // Loja Virtual
  {
    path: '',
    component: Home,
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: Home
  },
  {
    path: 'catalogo',
    component: Catalogo
  },
  {
    path: 'carrinho',
    component: Carrinho
  },
  {
    path: 'finalizar-pedido',
    component: FinalizarPedido
  },
  {
    path: 'meus-pedidos',
    component: ConsultarPedidos
  },

  // Painel Administrativo
  {
    path: 'admin',
    component: Admin,
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: Inicio },
      { path: 'clientes', component: Clientes },
      { path: 'funcionarios', component: Funcionarios },
      { path: 'categorias', component: Categorias },
      { path: 'produtos', component: Produtos },
      { path: 'servicos', component: Servicos },
      { path: 'estoque', component: Estoque },
      { path: 'entradas', component: Entradas },
      { path: 'atendimentos', component: Atendimentos },
      { path: 'pedidos', component: MeusPedidos }
    ]
  },

  // Redirecionamentos de atalhos diretos para o Admin
  { path: 'inicio', redirectTo: 'admin/inicio', pathMatch: 'full' },
  { path: 'clientes', redirectTo: 'admin/clientes', pathMatch: 'full' },
  { path: 'funcionarios', redirectTo: 'admin/funcionarios', pathMatch: 'full' },
  { path: 'categorias', redirectTo: 'admin/categorias', pathMatch: 'full' },
  { path: 'produtos', redirectTo: 'admin/produtos', pathMatch: 'full' },
  { path: 'servicos', redirectTo: 'admin/servicos', pathMatch: 'full' },
  { path: 'estoque', redirectTo: 'admin/estoque', pathMatch: 'full' },
  { path: 'entradas', redirectTo: 'admin/entradas', pathMatch: 'full' },
  { path: 'atendimentos', redirectTo: 'admin/atendimentos', pathMatch: 'full' },

  {
    path: '**',
    redirectTo: ''
  }
];