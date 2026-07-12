import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';

/// Acceso de bajo nivel al endpoint del dashboard de la app móvil.
class DashboardApi {
  DashboardApi(this._cliente);

  final ClienteHttp _cliente;

  Future<Map<String, dynamic>> obtenerResumen() async {
    final Response<dynamic> respuesta = await _cliente.obtener(
      '/mobile/dashboard',
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }
}
