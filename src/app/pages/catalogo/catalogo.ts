import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CarrinhoService } from '../../services/carrinho.service';

import {
  CatalogoService,
  ItemCatalogo
} from '../../services/catalogo.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  private catalogoService = inject(CatalogoService);

  // Permite solicitar a atualização da interface.
  private cdr = inject(ChangeDetectorRef);

  // Todos os itens recebidos da API.
  itens: ItemCatalogo[] = [];

  // Texto digitado na pesquisa.
  pesquisa = '';

  // Categoria selecionada no filtro.
  categoriaSelecionada = '';

  // Tipo selecionado: todos, produtos ou serviços.
  tipoSelecionado = 'T';

  carregando = false;
  mensagemErro = '';

  // Serviço responsável pelo carrinho.
  private carrinhoService = inject(CarrinhoService);

  // Mostra a quantidade atual de unidades no carrinho.
  get quantidadeCarrinho(): number {
    return this.carrinhoService.quantidadeTotal;
  }

  ngOnInit(): void {
    this.carregarItens();
  }

  // Consulta os dados da API.
  carregarItens(): void {
    console.log('1. Iniciando consulta do catálogo');

    this.carregando = true;
    this.mensagemErro = '';

    this.catalogoService.listarItens().subscribe({
      next: (dados) => {
        console.log('2. Dados recebidos da API:', dados);

        // Mostra apenas itens ativos.
        this.itens = (dados ?? []).filter(
          item =>
            !item.ativoProdutoServico ||
            item.ativoProdutoServico.toUpperCase() === 'S'
        );

        this.carregando = false;

        console.log(
          '3. Itens ativos atribuídos:',
          this.itens.length
        );

        // Solicita a atualização da interface.
        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error(
          'Erro ao carregar o catálogo:',
          erro
        );

        this.mensagemErro =
          'Não foi possível carregar os itens. Verifique se a API está funcionando.';

        this.carregando = false;

        // Atualiza a interface em caso de erro.
        this.cdr.markForCheck();
      }
    });
  }

  // Aplica a pesquisa e os filtros.
  get itensFiltrados(): ItemCatalogo[] {
    return this.itens.filter(item => {
      const nome = this.nomeItem(item).toLowerCase();
      const texto = this.pesquisa.trim().toLowerCase();

      const correspondeNome = nome.includes(texto);

      const correspondeCategoria =
        this.categoriaSelecionada === '' ||
        item.idcategoria.toString() ===
          this.categoriaSelecionada;

      const correspondeTipo =
        this.tipoSelecionado === 'T' ||
        item.tipoItem?.toUpperCase() ===
          this.tipoSelecionado;

      return correspondeNome &&
        correspondeCategoria &&
        correspondeTipo;
    });
  }

  // Obtém o nome do item.
  nomeItem(item: ItemCatalogo): string {
    return item.item1 || item.item || 'Item sem nome';
  }

  // Retorna as categorias disponíveis nos itens carregados.
  get categorias(): { id: number; nome: string }[] {
    const ids = [...new Set(
      this.itens.map(item => item.idcategoria)
    )];

    return ids.map(id => ({
      id,
      nome: `Categoria ${id}`
    }));
  }

  // Adiciona uma unidade ao carrinho.
  adicionarAoCarrinho(item: ItemCatalogo): void {
    this.carrinhoService.adicionar(item);

    alert(
      `${this.nomeItem(item)} foi adicionado ao carrinho.`
    );

    this.cdr.markForCheck();
  }

  // Formata o preço em reais.
  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}
