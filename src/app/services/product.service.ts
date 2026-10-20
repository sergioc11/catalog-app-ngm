import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/products`;   // .../catalog-management/v1/products

  // Filtros opcionales: solo se envían los que tienen valor (?categoryId=1&name=tec)
  getProducts(categoryId: number | null, name: string = ''): Observable<ApiResponse<Product[]>> {
    const params: any = {};
    if (categoryId) params.categoryId = categoryId;
    if (name) params.name = name;
    return this.http.get<ApiResponse<Product[]>>(this.url, { params });
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.url}/${id}`);
  }

  createProduct(product: Product): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.url, product);
  }

  updateProduct(id: number, product: Product): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.url}/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${this.url}/${id}`);
  }
}
