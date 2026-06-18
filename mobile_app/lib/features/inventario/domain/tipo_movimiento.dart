/// Tipo de movimiento de inventario soportado por la app móvil.
enum TipoMovimiento {
  entrada,
  salida;

  /// Código que espera la API (`in` / `out`).
  String get codigoApi => this == TipoMovimiento.entrada ? 'in' : 'out';

  String get etiqueta => this == TipoMovimiento.entrada ? 'Entrada' : 'Salida';
}
