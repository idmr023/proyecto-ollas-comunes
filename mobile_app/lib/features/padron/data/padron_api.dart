import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';

/// Acceso de bajo nivel a los endpoints del padrón de beneficiarios.
class PadronApi {
  PadronApi(this._cliente);

  final ClienteHttp _cliente;

  Future<Map<String, dynamic>> listar({String? busqueda}) async {
    final Response<dynamic> respuesta = await _cliente.obtener(
      '/beneficiaries',
      query: <String, dynamic>{
        if (busqueda != null && busqueda.isNotEmpty) 'query': busqueda,
      },
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<Map<String, dynamic>> crear(Map<String, dynamic> cuerpo) async {
    final Response<dynamic> respuesta = await _cliente.publicar(
      '/beneficiaries',
      cuerpo: cuerpo,
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<Map<String, dynamic>> actualizar(
    String id,
    Map<String, dynamic> cuerpo,
  ) async {
    final Response<dynamic> respuesta = await _cliente.actualizarParcial(
      '/beneficiaries/$id',
      cuerpo: cuerpo,
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<void> eliminar(String id) async {
    await _cliente.eliminar('/beneficiaries/$id');
  }

  Future<void> registrarEntrega({
    required List<String> beneficiarioIds,
    String? nombrePlato,
  }) async {
    await _cliente.publicar(
      '/mobile/deliveries',
      cuerpo: <String, dynamic>{
        'beneficiaryIds': beneficiarioIds,
        if (nombrePlato != null && nombrePlato.isNotEmpty)
          'dishName': nombrePlato,
      },
    );
  }

  Future<Map<String, dynamic>> listarCondiciones() async {
    final Response<dynamic> respuesta = await _cliente.obtener(
      '/beneficiaries/conditions',
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<Map<String, dynamic>> listarOllas() async {
    final Response<dynamic> respuesta = await _cliente.obtener(
      '/beneficiaries/ollas',
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }
}
