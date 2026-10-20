import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-products',
  templateUrl: 'products.page.html',
  styleUrls: ['products.page.scss'],
  standalone: false,   // la página pertenece a ProductsPageModule
})
export class ProductsPage implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // signal() actualiza la pantalla cuando llega la respuesta de la API
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  loadFailed = signal(false);          // true si la lista no se pudo cargar (muestra "Reintentar")

  // Errores de validación (400) que se muestran dentro del formulario
  errorMessage = signal('');
  errors = signal<string[]>([]);

  // Filtros
  categoryFilter = 0;          // 0 = "Todas"
  nameFilter = '';             // '' = sin filtro por nombre

  // Formulario (modal)
  formOpen = signal(false);
  editingId: number | null = null;   // null = creando, número = editando
  form: Product = this.emptyForm();

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => this.categories.set([]),   // el interceptor ya muestra el aviso
    });
    this.loadProducts();
  }

  // ---------- Lista y filtros ----------
  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.categoryFilter || null, this.nameFilter).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loadFailed.set(false);
        this.loading.set(false);
      },
      // Si la lista falla se muestra "Reintentar" (el interceptor ya avisó si fue 0 o 5xx)
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  // El buscador busca mientras escribes (con debounce de 400 ms)
  onSearch(event: CustomEvent): void {
    this.nameFilter = event.detail.value ?? '';
    this.loadProducts();
  }

  onCategoryChange(event: CustomEvent): void {
    this.categoryFilter = Number(event.detail.value);
    this.loadProducts();
  }

  categoryName(id: number): string {
    const category = this.categories().find(c => c.id === id);
    return category ? category.name : '';
  }

  // ---------- Formulario ----------
  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.clearError();
    this.formOpen.set(true);
  }

  edit(product: Product): void {
    this.editingId = product.id!;
    this.form = { ...product };
    this.clearError();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.clearError();
  }

  // Crea (POST → 201) o actualiza (PUT → 200)
  save(): void {
    const request = this.editingId
      ? this.productService.updateProduct(this.editingId, this.form)
      : this.productService.createProduct(this.form);

    request.subscribe({
      next: (res) => {
        this.formOpen.set(false);
        this.showToast(res.message, 'success');
        this.loadProducts();
      },
      error: (err) => this.handleError(err),
    });
  }

  // Pide confirmación antes de eliminar (DELETE → 200)
  async remove(product: Product): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: `¿Seguro que deseas eliminar "${product.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.confirmRemove(product) },
      ],
    });
    await alert.present();
  }

  private confirmRemove(product: Product): void {
    this.productService.deleteProduct(product.id!).subscribe({
      next: (res) => {
        this.formOpen.set(false);
        this.showToast(res.message, 'success');
        this.loadProducts();
      },
      error: (err) => this.handleError(err),
    });
  }

  // ---------- Manejo de errores por status ----------
  // err.status = código HTTP. err.error = body con la respuesta estándar { message, errors }.
  private handleError(err: HttpErrorResponse): void {
    const body = err.error as ApiResponse<null> | null;

    switch (err.status) {
      case 400:   // Datos inválidos: se muestran en el formulario con el detalle de errors
        this.errorMessage.set(body?.message ?? 'Los datos no son válidos');
        this.errors.set(body?.errors ?? []);
        break;
      case 404:   // El producto ya no existe (ej: lo eliminó otro usuario): avisar y refrescar
        this.formOpen.set(false);
        this.showToast(body?.message ?? 'El producto ya no existe', 'warning');
        this.loadProducts();
        break;
      default:    // 0 (sin conexión) y 5xx: ya los muestra httpErrorInterceptor
        break;
    }
  }

  private clearError(): void {
    this.errorMessage.set('');
    this.errors.set([]);
  }

  private async showToast(message: string, color: 'success' | 'warning'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'top',
      icon: color === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline',
    });
    await toast.present();
  }

  private emptyForm(): Product {
    return { name: '', price: 0, stock: 0, categoryId: 0 };
  }
}
