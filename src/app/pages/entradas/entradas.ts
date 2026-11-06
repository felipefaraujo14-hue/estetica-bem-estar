import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  EntradaProduto,
  EntradaProdutoService,
  ProdutoEstoque
} from '../../services/entrada-produto.service';

@Component({
  selector: 'app-entradas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entradas.html',
  styleUrl: './entradas.css'
})
export class Entradas implements OnInit {

  // Lista de produtos disponíveis no estoque.
  produtos: ProdutoEstoque[] = [];

  // Histórico de entradas de produtos.
  entradas: EntradaProduto[] = [];

  // Dados do formulário.
  iditem: number | null = null;
  dataEntradaProduto = this.dataAtual();
  quantidadeEntrada: number | null = null;
  unidade = '';
  valorUnitarioEntrada: number | null = null;

  // Controla os estados da tela.
  carregando = false;
  salvando = false;

  // Mensagens apresentadas ao usuário.
  mensagemErro = '';
  mensagemSucesso = '';

  constructor(
    private entradaService: EntradaProdutoService,
    private cdr: ChangeDetectorRef
  ) {}

  // Executa quando a página é inicializada.
  ngOnInit(): void {
    this.carregarDados();
  }

  // Retorna a data atual no formato AAAA-MM-DD.
  // É pública para também poder ser chamada pelo HTML.
  dataAtual(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  // Carrega os produtos do estoque e o histórico de entradas.
  carregarDados(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.cdr.markForCheck();

    this.entradaService.listarProdutosEstoque().subscribe({
      next: (produtos) => {
        this.produtos = produtos ?? [];

        // Após carregar os produtos, busca o histórico.
        this.entradaService.listar().subscribe({
          next: (entradas) => {
            // Exibe as entradas mais recentes primeiro.
            this.entradas = [...(entradas ?? [])].reverse();

            this.carregando = false;
            this.cdr.markForCheck();
          },
          error: (erro) => {
            console.error('Erro ao carregar entradas:', erro);

            this.mensagemErro =
              'Não foi possível carregar o histórico de entradas.';

            this.carregando = false;
            this.cdr.markForCheck();
          }
        });

        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao carregar produtos do estoque:', erro);

        this.mensagemErro =
          'Não foi possível carregar os produtos. Verifique se a API de estoque está funcionando.';

        this.carregando = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Preenche a unidade e o preço ao selecionar um produto.
  aoSelecionarProduto(): void {
    const produto = this.produtos.find(
      p => p.iditem === Number(this.iditem)
    );

    if (produto) {
      this.unidade = produto.unidade;
      this.valorUnitarioEntrada = Number(produto.precoVenda);
    } else {
      this.unidade = '';
      this.valorUnitarioEntrada = null;
    }
  }

  // Calcula o valor total da entrada.
  get valorTotal(): number {
    return Number(this.quantidadeEntrada ?? 0) *
      Number(this.valorUnitarioEntrada ?? 0);
  }

  // Localiza o nome do produto pelo identificador.
  nomeProduto(iditem: number): string {
    return this.produtos.find(
      p => p.iditem === iditem
    )?.nomeProduto ?? `Produto ${iditem}`;
  }

  // Formata um valor no padrão monetário brasileiro.
  formatarMoeda(valor: number): string {
    return Number(valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Limpa os campos do formulário.
  limparFormulario(): void {
    this.iditem = null;
    this.dataEntradaProduto = this.dataAtual();
    this.quantidadeEntrada = null;
    this.unidade = '';
    this.valorUnitarioEntrada = null;

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.cdr.markForCheck();
  }

  // Registra uma nova entrada por meio da API.
  salvarEntrada(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    // Valida os campos antes de enviar os dados.
    if (
      this.iditem === null ||
      !this.dataEntradaProduto ||
      this.quantidadeEntrada === null ||
      !Number.isFinite(Number(this.quantidadeEntrada)) ||
      this.quantidadeEntrada <= 0 ||
      !Number.isInteger(Number(this.quantidadeEntrada)) ||
      this.valorUnitarioEntrada === null ||
      !Number.isFinite(Number(this.valorUnitarioEntrada)) ||
      this.valorUnitarioEntrada < 0 ||
      !this.unidade.trim()
    ) {
      this.mensagemErro =
        'Preencha todos os campos corretamente. A quantidade deve ser um número inteiro positivo.';

      return;
    }

    // Monta o objeto conforme os campos esperados pela API.
    const dados = {
      iditem: Number(this.iditem),
      dataEntradaProduto: this.dataEntradaProduto,
      quantidadeEntrada: Number(this.quantidadeEntrada),
      unidade: this.unidade.trim(),
      valorUnitarioEntrada: Number(this.valorUnitarioEntrada)
    };

    this.salvando = true;
    this.cdr.markForCheck();

    this.entradaService.cadastrar(dados).subscribe({
      next: () => {
        this.mensagemSucesso =
          'Entrada de produto registrada com sucesso.';

        // Limpa o formulário após o cadastro.
        this.limparFormulario();

        // Mantém a mensagem de sucesso visível.
        this.mensagemSucesso =
          'Entrada de produto registrada com sucesso.';

        this.salvando = false;

        // Atualiza o histórico e a lista de produtos.
        this.carregarDados();
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao registrar entrada:', erro);

        const detalhe = erro?.error;

        this.mensagemErro =
          typeof detalhe === 'string'
            ? detalhe
            : detalhe?.mensagem ??
              detalhe?.message ??
              'Não foi possível registrar a entrada. Verifique os dados e tente novamente.';

        this.salvando = false;
        this.cdr.markForCheck();
      }
    });
  }
}