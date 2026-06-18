import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/repositorio_menu_ia.dart';
import '../domain/sugerencia_menu.dart';

/// Implementación del [RepositorioMenuIa] sobre GET /mobile/suggestions.
class MenuIaRepositorioImpl implements RepositorioMenuIa {
  MenuIaRepositorioImpl(this._cliente);

  final ClienteHttp _cliente;

  @override
  Future<Resultado<List<SugerenciaMenu>>> obtenerSugerencias() async {
    try {
      final Response<dynamic> respuesta = await _cliente.obtener('/mobile/suggestions');
      final Map<String, dynamic> datos = Map<String, dynamic>.from(respuesta.data as Map);
      final List<dynamic> items = (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      return Resultado<List<SugerenciaMenu>>.exito(
        items.map((dynamic e) => SugerenciaMenu.desdeJson(Map<String, dynamic>.from(e as Map))).toList(),
      );
    } on DioException catch (err) {
      return Resultado<List<SugerenciaMenu>>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
