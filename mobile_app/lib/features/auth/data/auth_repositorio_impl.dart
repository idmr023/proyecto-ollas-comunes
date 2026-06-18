import 'package:dio/dio.dart';
import '../../../core/errores/excepciones.dart';
import '../../../core/red/cliente_http.dart';
import '../../../core/red/resultado.dart';
import '../../../core/sesion/almacen_sesion.dart';
import '../domain/entidades/usuario.dart';
import '../domain/repositorio_auth.dart';
import '../domain/resultado_login.dart';
import 'auth_api.dart';

/// Implementación del [RepositorioAuth] sobre la API REST de SIGO-OLLAS.
/// Traduce las respuestas JSON a entidades de dominio y los errores de red a
/// [ExcepcionApp], devolviendo siempre un [Resultado] (sin lanzar a la UI).
class AuthRepositorioImpl implements RepositorioAuth {
  AuthRepositorioImpl({required AuthApi api, required AlmacenSesion almacenSesion})
      : _api = api,
        _almacenSesion = almacenSesion;

  final AuthApi _api;
  final AlmacenSesion _almacenSesion;

  @override
  Future<Resultado<ResultadoLogin>> iniciarSesion({
    required String email,
    required String password,
  }) async {
    try {
      final Map<String, dynamic> datos = await _api.iniciarSesion(email: email, password: password);
      return Resultado<ResultadoLogin>.exito(_mapearResultadoLogin(datos));
    } on DioException catch (err) {
      return Resultado<ResultadoLogin>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<Usuario>> verificarCodigo({
    required String email,
    required String tempToken,
    required String codigo,
  }) async {
    try {
      final Map<String, dynamic> datos = await _api.verificarCodigo(
        email: email,
        tempToken: tempToken,
        codigo: codigo,
      );
      final String token = datos['token'] as String;
      await _almacenSesion.guardarToken(token);
      return Resultado<Usuario>.exito(Usuario.desdeJson(Map<String, dynamic>.from(datos['user'] as Map)));
    } on DioException catch (err) {
      return Resultado<Usuario>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<Resultado<Usuario>> obtenerUsuarioActual() async {
    try {
      final Map<String, dynamic> datos = await _api.obtenerUsuarioActual();
      return Resultado<Usuario>.exito(Usuario.desdeJson(Map<String, dynamic>.from(datos['user'] as Map)));
    } on DioException catch (err) {
      return Resultado<Usuario>.fallo(ClienteHttp.traducirError(err));
    }
  }

  @override
  Future<bool> haySesionActiva() => _almacenSesion.tieneSesion();

  @override
  Future<void> cerrarSesion() => _almacenSesion.cerrarSesion();

  ResultadoLogin _mapearResultadoLogin(Map<String, dynamic> datos) {
    final String estado = datos['status'] as String? ?? '';
    final String tempToken = datos['tempToken'] as String? ?? '';
    final String email = datos['email'] as String? ?? '';
    if (estado == 'TOTP_SETUP_REQUIRED') {
      return ConfiguracionTotpRequerida(
        tempToken: tempToken,
        email: email,
        secret: datos['secret'] as String? ?? '',
        qrCodeUri: datos['qrCodeUri'] as String? ?? '',
      );
    }
    return MfaPendiente(tempToken: tempToken, email: email);
  }
}
