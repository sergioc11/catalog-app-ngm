import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
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

  // Mensaje de error de la API (message + errors). Los éxitos se confirman con un toast.
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
      error: (err) => this.showError(err),
    });
    this.loadProducts();
  }

  // ---------- Lista y filtros ----------
  loadProducts(): void {
    this.loading.set(true);
    this.productService.getProducts(this.categoryFilter || null, this.nameFilter).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.clearError();
        this.loading.set(false);
      },
      error: (err) => {
        this.showError(err);
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

  // Crea (POST → 201) o actualiza (PUT → 200). Si la API responde 400 o 404, se muestra el error.
  save(): void {
    const request = this.editingId
      ? this.productService.updateProduct(this.editingId, this.form)
      : this.productService.createProduct(this.form);

    request.subscribe({
      next: (res) => {
        this.formOpen.set(false);
        this.showToast(res.message);
        this.loadProducts();
      },
      error: (err) => this.showError(err),
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
        this.showToast(res.message);
        this.loadProducts();
      },
      error: (err) => this.showError(err),
    });
  }

  // ---------- Mensajes ----------
  // err.status = código HTTP (0 si no hubo respuesta). err.error = body estándar { message, errors }.
  private showError(err: HttpErrorResponse): void {
    if (err.status === 0) {
      this.errorMessage.set('No se pudo conectar con la API');
      this.errors.set([]);
      return;
    }
    this.errorMessage.set(err.error?.message ?? 'Error inesperado');
    this.errors.set(err.error?.errors ?? []);
  }

  private clearError(): void {
    this.errorMessage.set('');
    this.errors.set([]);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, color: 'success', position: 'top', icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }

  private emptyForm(): Product {
    return { name: '', price: 0, stock: 0, categoryId: 0 };
  }
}
