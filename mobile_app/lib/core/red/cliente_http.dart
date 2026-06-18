import 'package:dio/dio.dart';
import '../../config/entorno/entorno.dart';
import '../errores/excepciones.dart';
import '../sesion/almacen_sesion.dart';

/// Cliente HTTP central de la app, construido sobre Dio. Agrega el token JWT a
/// cada petición y traduce los errores de red a [ExcepcionApp] de dominio.
class ClienteHttp {
  ClienteHttp({required AlmacenSesion almacenSesion, Dio? dio})
      : _almacenSesion = almacenSesion,
        _dio = dio ?? Dio() {
    _configurar();
  }

  final Dio _dio;
  final AlmacenSesion _almacenSesion;

  /// Callback invocado cuando la API responde 401 (sesión inválida).
  void Function()? alExpirarSesion;

  void _configurar() {
    _dio.options.baseUrl = '${Entorno.urlBaseApi}${Entorno.prefijoApi}';
    _dio.options.connectTimeout = const Duration(seconds: 15);
    _dio.options.receiveTimeout = const Duration(seconds: 20);
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _agregarToken,
        onError: _manejarError,
      ),
    );
  }

  Future<void> _agregarToken(
    RequestOptions opciones,
    RequestInterceptorHandler manejador,
  ) async {
    final String? token = await _almacenSesion.obtenerToken();
    if (token != null && token.isNotEmpty) {
      opciones.headers['Authorization'] = 'Bearer $token';
    }
    manejador.next(opciones);
  }

  void _manejarError(DioException error, ErrorInterceptorHandler manejador) {
    if (error.response?.statusCode == 401) {
      alExpirarSesion?.call();
    }
    manejador.next(error);
  }

  Future<Response<dynamic>> obtener(String ruta, {Map<String, dynamic>? query}) {
    return _dio.get(ruta, queryParameters: query);
  }

  Future<Response<dynamic>> publicar(String ruta, {Object? cuerpo}) {
    return _dio.post(ruta, data: cuerpo);
  }

  Future<Response<dynamic>> actualizar(String ruta, {Object? cuerpo}) {
    return _dio.put(ruta, data: cuerpo);
  }

  Future<Response<dynamic>> eliminar(String ruta) {
    return _dio.delete(ruta);
  }

  /// Traduce un [DioException] a la [ExcepcionApp] de dominio correspondiente.
  static ExcepcionApp traducirError(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError) {
      return const ExcepcionRed();
    }
    final int? estado = error.response?.statusCode;
    if (estado == 401 || estado == 403) {
      return ExcepcionNoAutorizado(_mensajeServidor(error) ?? 'Credenciales inválidas.');
    }
    final String? mensaje = _mensajeServidor(error);
    if (mensaje != null) {
      return ExcepcionServidor(mensaje, codigoEstado: estado);
    }
    return const ExcepcionDesconocida();
  }

  static String? _mensajeServidor(DioException error) {
    final dynamic datos = error.response?.data;
    if (datos is Map && datos['message'] is String) {
      return datos['message'] as String;
    }
    return null;
  }
}
