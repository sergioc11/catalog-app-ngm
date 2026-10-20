// Forma estándar de todas las respuestas de la API.
// <T> es el tipo de "data": Product[], Product, Category[], etc.
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: boolean;
  errors: string[];
}
