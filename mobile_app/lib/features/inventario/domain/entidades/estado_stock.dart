/// Estado del nivel de stock de un insumo, usado para el semáforo del mockup.
///
/// NOTA: el endpoint actual no expone el stock mínimo por insumo, por lo que el
/// estado se deriva con umbrales fijos en el cliente. Es una heurística temporal
/// hasta que el backend incluya el mínimo de cada insumo en la respuesta.
enum EstadoStock {
  ok,
  bajo,
  critico;

  static const double umbralCritico = 1;
  static const double umbralBajo = 5;

  /// Deriva el estado a partir de la cantidad disponible.
  static EstadoStock segunCantidad(double cantidad) {
    if (cantidad <= umbralCritico) return EstadoStock.critico;
    if (cantidad <= umbralBajo) return EstadoStock.bajo;
    return EstadoStock.ok;
  }

  String get etiqueta => switch (this) {
        EstadoStock.ok => 'En stock',
        EstadoStock.bajo => 'Stock bajo',
        EstadoStock.critico => 'Crítico',
      };
}
