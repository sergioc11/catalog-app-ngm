import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { ToastController } from '@ionic/angular/lazy';
import { catchError, throwError } from 'rxjs';

// Maneja en un solo lugar los errores GLOBALES de cualquier petición HTTP:
//   0   -> no hubo respuesta (API apagada o URL incorrecta)
//   5xx -> error del servidor
// Los errores de negocio (400, 404) los maneja cada página, porque dependen de la pantalla.
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastCtrl = inject(ToastController);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = '';
      if (err.status === 0) message = 'No se pudo conectar con el servidor';
      else if (err.status >= 500) message = 'Error del servidor. Intenta de nuevo más tarde';

      if (message) {
        toastCtrl.create({ message, duration: 3000, color: 'danger', position: 'top' }).then(t => t.present());
      }
      return throwError(() => err);   // se re-lanza para que la página también pueda reaccionar
    }),
  );
};
