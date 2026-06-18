import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../domain/entidades/resumen_dashboard.dart';
import '../domain/repositorio_dashboard.dart';
import 'dashboard_api.dart';

/// Implementación del [RepositorioDashboard] sobre la API REST.
class DashboardRepositorioImpl implements RepositorioDashboard {
  DashboardRepositorioImpl(this._api);

  final DashboardApi _api;

  @override
  Future<Resultado<ResumenDashboard>> obtenerResumen() async {
    try {
      final Map<String, dynamic> datos = await _api.obtenerResumen();
      return Resultado<ResumenDashboard>.exito(ResumenDashboard.desdeJson(datos));
    } on DioException catch (err) {
      return Resultado<ResumenDashboard>.fallo(ClienteHttp.traducirError(err));
    }
  }
}
