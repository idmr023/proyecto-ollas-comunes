import '../../../core/red/resultado.dart';
import 'entidades/resumen_dashboard.dart';

/// Contrato del repositorio del dashboard de la olla común.
abstract interface class RepositorioDashboard {
  /// Obtiene el resumen del día (raciones, menú e insumos por vencer).
  Future<Resultado<ResumenDashboard>> obtenerResumen();
}
