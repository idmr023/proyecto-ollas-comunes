import '../../../core/red/resultado.dart';
import 'sugerencia_menu.dart';

/// Contrato del repositorio de sugerencias de menú (IA).
abstract interface class RepositorioMenuIa {
  Future<Resultado<List<SugerenciaMenu>>> obtenerSugerencias();
}
