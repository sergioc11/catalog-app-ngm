export interface Product {
  id?: number;          // Opcional: al crear no existe, lo asigna la API
  name: string;
  price: number;
  stock: number;
  categoryId: number;
}
