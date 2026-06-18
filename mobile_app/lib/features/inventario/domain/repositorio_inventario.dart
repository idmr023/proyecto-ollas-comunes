import '../../../core/red/resultado.dart';
import 'entidades/insumo.dart';
import 'tipo_movimiento.dart';

/// Contrato del repositorio de inventario de la olla común.
abstract interface class RepositorioInventario {
  /// Lista los insumos con su stock actual.
  Future<Resultado<List<Insumo>>> obtenerInventario();

  /// Registra un movimiento de entrada o salida sobre un insumo.
  Future<Resultado<void>> registrarMovimiento({
    required String insumoId,
    required TipoMovimiento tipo,
    required double cantidad,
    String? nota,
  });
}
