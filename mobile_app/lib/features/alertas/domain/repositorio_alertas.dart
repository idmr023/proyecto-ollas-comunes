import '../../../core/red/resultado.dart';
import 'alerta.dart';

/// Contrato del repositorio de alertas de la olla común.
abstract interface class RepositorioAlertas {
  Future<Resultado<List<Alerta>>> obtenerAlertas();
}
