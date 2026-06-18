import 'package:dio/dio.dart';
import '../../../core/red/cliente_http.dart';

/// Acceso de bajo nivel a los endpoints de autenticación de la API.
/// Devuelve el cuerpo decodificado o propaga [DioException] al repositorio.
class AuthApi {
  AuthApi(this._cliente);

  final ClienteHttp _cliente;

  Future<Map<String, dynamic>> iniciarSesion({
    required String email,
    required String password,
  }) async {
    final Response<dynamic> respuesta = await _cliente.publicar(
      '/auth/login',
      cuerpo: <String, dynamic>{'email': email, 'password': password},
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<Map<String, dynamic>> verificarCodigo({
    required String email,
    required String tempToken,
    required String codigo,
  }) async {
    final Response<dynamic> respuesta = await _cliente.publicar(
      '/auth/verify-otp',
      cuerpo: <String, dynamic>{'email': email, 'tempToken': tempToken, 'code': codigo},
    );
    return Map<String, dynamic>.from(respuesta.data as Map);
  }

  Future<Map<String, dynamic>> obtenerUsuarioActual() async {
    final Response<dynamic> respuesta = await _cliente.obtener('/auth/me');
    return Map<String, dynamic>.from(respuesta.data as Map);
  }
}
