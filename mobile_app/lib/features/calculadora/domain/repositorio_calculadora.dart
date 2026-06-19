import '../../../core/red/resultado.dart';
import 'receta_resumen.dart';
import 'resultado_preparacion.dart';

/// Contrato del repositorio de la calculadora de preparación.
abstract interface class RepositorioCalculadora {
  /// Lista las recetas disponibles para el selector.
  Future<Resultado<List<RecetaResumen>>> listarRecetas();

  /// Calcula los ingredientes necesarios para [personas] según la receta.
  /// Si [personas] es null, el backend usa el conteo del padrón.
  Future<Resultado<ResultadoPreparacion>> calcular({
    required String recetaId,
    int? personas,
  });
}
