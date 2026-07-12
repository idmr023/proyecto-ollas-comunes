import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/alerta.dart';
import '../domain/repositorio_alertas.dart';

/// Implementación del [RepositorioAlertas] sobre GET /mobile/alerts.
class AlertasRepositorioImpl implements RepositorioAlertas {
  AlertasRepositorioImpl(this._cliente);

  final ClienteHttp _cliente;

  @override
  Future<Resultado<List<Alerta>>> obtenerAlertas() async {
    try {
      final Response<dynamic> respuesta = await _cliente.obtener(
        '/mobile/alerts',
      );
      final Map<String, dynamic> datos = Map<String, dynamic>.from(
        respuesta.data as Map,
      );
      final List<dynamic> items =
          (datos['items'] as List<dynamic>?) ?? <dynamic>[];
      return Resultado<List<Alerta>>.exito(
        items
            .map(
              (dynamic e) =>
                  Alerta.desdeJson(Map<String, dynamic>.from(e as Map)),
            )
            .toList(),
      );
    } on DioException catch (err) {
      return Resultado<List<Alerta>>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
