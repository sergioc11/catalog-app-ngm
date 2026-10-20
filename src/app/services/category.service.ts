import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/categories`;

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.url);
  }
}
