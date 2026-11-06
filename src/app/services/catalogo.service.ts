
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define os dados que serão recebidos da API.
export interface ItemCatalogo {
  iditem: number;
  idcategoria: number;
  item1?: string;
  item?: string;
  descricaoItem?: string;
  preco: number;
  tipoItem: string;
  ativoProdutoServico?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  // Permite realizar requisições HTTP.
  private http = inject(HttpClient);

  // Endereço do endpoint da API ASP.NET Core.
 
private apiUrl = 'https://localhost:7038/api/ItemServico';


  // Busca todos os itens cadastrados na API.
  listarItens(): Observable<ItemCatalogo[]> {
    return this.http.get<ItemCatalogo[]>(this.apiUrl);
  }
}
