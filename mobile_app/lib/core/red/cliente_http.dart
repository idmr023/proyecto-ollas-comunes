import 'dart:async';

import 'package:dio/dio.dart';
import '../../config/entorno/entorno.dart';
import '../errores/excepciones.dart';
import '../offline/almacen_offline.dart';
import '../sesion/almacen_sesion.dart';

/// Cliente HTTP central de la app, construido sobre Dio. Agrega el token JWT a
/// cada petición y traduce los errores de red a [ExcepcionApp] de dominio.
class ClienteHttp {
  ClienteHttp({
    required AlmacenSesion almacenSesion,
    AlmacenOffline? almacenOffline,
    Dio? dio,
  }) : _almacenSesion = almacenSesion,
       _almacenOffline = almacenOffline,
       _dio = dio ?? Dio() {
    _configurar();
  }

  final Dio _dio;
  final AlmacenSesion _almacenSesion;
  final AlmacenOffline? _almacenOffline;
  bool _sincronizandoEnSegundoPlano = false;

  /// Callback invocado cuando la API responde 401 (sesión inválida).
  void Function()? alExpirarSesion;

  void _configurar() {
    _dio.options.baseUrl = '${Entorno.urlBaseApi}${Entorno.prefijoApi}';
    // Render (plan free) puede tardar 30–60 s en despertar; 15 s provocaba falsos errores de red.
    _dio.options.connectTimeout = const Duration(seconds: 60);
    _dio.options.receiveTimeout = const Duration(seconds: 60);
    _dio.interceptors.add(
      InterceptorsWrapper(onRequest: _agregarToken, onError: _manejarError),
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

  Future<Response<dynamic>> obtener(
    String ruta, {
    Map<String, dynamic>? query,
  }) async {
    final String claveCache = claveCacheHttp(ruta, query: query);
    try {
      final Response<dynamic> respuesta = await _dio.get(
        ruta,
        queryParameters: query,
      );
      await _almacenOffline?.guardarCache(claveCache, respuesta.data);
      unawaited(_sincronizarPendientesSiCorresponde());
      return respuesta;
    } on DioException catch (error) {
      final Object? cache = await _almacenOffline?.leerCache(claveCache);
      if (_esErrorDeConexion(error) && cache != null) {
        return Response<dynamic>(
          data: cache,
          requestOptions: error.requestOptions,
          statusCode: 200,
          statusMessage: 'offline-cache',
        );
      }
      rethrow;
    }
  }

  Future<Response<dynamic>> publicar(String ruta, {Object? cuerpo}) {
    return _enviarConCola('POST', ruta, cuerpo: cuerpo);
  }

  Future<Response<dynamic>> actualizar(String ruta, {Object? cuerpo}) {
    return _enviarConCola('PUT', ruta, cuerpo: cuerpo);
  }

  Future<Response<dynamic>> actualizarParcial(String ruta, {Object? cuerpo}) {
    return _enviarConCola('PATCH', ruta, cuerpo: cuerpo);
  }

  Future<Response<dynamic>> eliminar(String ruta) {
    return _enviarConCola('DELETE', ruta);
  }

  Future<Response<dynamic>> _enviarConCola(
    String metodo,
    String ruta, {
    Object? cuerpo,
  }) async {
    try {
      final Response<dynamic> respuesta = await _dio.request<dynamic>(
        ruta,
        data: cuerpo,
        options: Options(method: metodo),
      );
      unawaited(_sincronizarPendientesSiCorresponde());
      return respuesta;
    } on DioException catch (error) {
      if (_almacenOffline != null &&
          _esErrorDeConexion(error) &&
          _permiteColaOffline(metodo, ruta)) {
        await _almacenOffline.agregarMutacion(
          metodo: metodo,
          ruta: ruta,
          cuerpo: cuerpo,
        );
        return Response<dynamic>(
          data: const <String, dynamic>{
            'ok': true,
            'offline': true,
            'queued': true,
            'message': 'Operacion guardada para sincronizar.',
          },
          requestOptions: error.requestOptions,
          statusCode: 202,
          statusMessage: 'offline-queued',
        );
      }
      rethrow;
    }
  }

  Future<int> sincronizarPendientes() async {
    final AlmacenOffline? almacen = _almacenOffline;
    if (almacen == null) return 0;
    final List<MutacionOffline> mutaciones = await almacen.listarMutaciones();
    int sincronizadas = 0;
    for (final MutacionOffline mutacion in mutaciones) {
      try {
        await _dio.request<dynamic>(
          mutacion.ruta,
          data: mutacion.cuerpo,
          options: Options(method: mutacion.metodo),
        );
        await almacen.eliminarMutacion(mutacion.id);
        sincronizadas++;
      } on DioException catch (error) {
        if (error.response?.statusCode == 401) rethrow;
        break;
      }
    }
    return sincronizadas;
  }

  Future<void> _sincronizarPendientesSiCorresponde() async {
    final AlmacenOffline? almacen = _almacenOffline;
    if (almacen == null || _sincronizandoEnSegundoPlano) return;
    if (await almacen.contarMutaciones() == 0) return;
    _sincronizandoEnSegundoPlano = true;
    try {
      await sincronizarPendientes();
    } catch (_) {
      // La sincronizacion oportunista no debe romper la peticion del usuario.
    } finally {
      _sincronizandoEnSegundoPlano = false;
    }
  }

  /// Traduce un [DioException] a la [ExcepcionApp] de dominio correspondiente.
  static ExcepcionApp traducirError(DioException error) {
    if (_esErrorDeConexion(error)) {
      return const ExcepcionRed();
    }
    final int? estado = error.response?.statusCode;
    if (estado == 401 || estado == 403) {
      return ExcepcionNoAutorizado(
        _mensajeServidor(error) ?? 'Credenciales inválidas.',
      );
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

  static bool _esErrorDeConexion(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.unknown;
  }

  static bool _permiteColaOffline(String metodo, String ruta) {
    if (ruta.startsWith('/auth/')) return false;
    if (metodo == 'GET') return false;
    return ruta == '/mobile/inventory/movements' ||
        ruta == '/mobile/deliveries' ||
        ruta == '/mobile/menu-plans/execute' ||
        ruta == '/mobile/documents/upload';
  }

  static String claveCacheHttp(String ruta, {Map<String, dynamic>? query}) {
    if (query == null || query.isEmpty) return ruta;
    final List<String> claves = query.keys.toList()..sort();
    final String parametros = claves
        .map(
          (String clave) =>
              '$clave=${Uri.encodeQueryComponent('${query[clave]}')}',
        )
        .join('&');
    return '$ruta?$parametros';
  }
}
