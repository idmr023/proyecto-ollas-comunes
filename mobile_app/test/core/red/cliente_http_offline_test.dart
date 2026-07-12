import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/core/offline/almacen_offline.dart';
import 'package:sigo_ollas/core/red/cliente_http.dart';
import 'package:sigo_ollas/core/sesion/almacen_sesion.dart';

class _PersistenciaOfflineMemoria implements PersistenciaOffline {
  final Map<String, String> _datos = <String, String>{};

  @override
  Future<String?> leer(String clave) async => _datos[clave];

  @override
  Future<void> escribir(String clave, String valor) async {
    _datos[clave] = valor;
  }
}

class _PersistenciaSesionMemoria implements PersistenciaSesion {
  final Map<String, String> _datos = <String, String>{};

  @override
  Future<void> escribir({required String clave, required String valor}) async {
    _datos[clave] = valor;
  }

  @override
  Future<String?> leer({required String clave}) async => _datos[clave];

  @override
  Future<void> eliminar({required String clave}) async {
    _datos.remove(clave);
  }
}

class _RespuestaFake {
  const _RespuestaFake.exito(this.datos) : error = false;
  const _RespuestaFake.sinRed() : datos = null, error = true;

  final Object? datos;
  final bool error;
}

Dio _dioFake(List<_RespuestaFake> respuestas) {
  final Dio dio = Dio();
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
        final _RespuestaFake respuesta = respuestas.removeAt(0);
        if (respuesta.error) {
          handler.reject(
            DioException(
              requestOptions: options,
              type: DioExceptionType.connectionError,
              error: 'sin red',
            ),
          );
          return;
        }
        handler.resolve(
          Response<dynamic>(
            requestOptions: options,
            data: respuesta.datos,
            statusCode: 200,
          ),
        );
      },
    ),
  );
  return dio;
}

ClienteHttp _cliente({required AlmacenOffline offline, required Dio dio}) {
  return ClienteHttp(
    almacenSesion: AlmacenSesion(_PersistenciaSesionMemoria()),
    almacenOffline: offline,
    dio: dio,
  );
}

void main() {
  test('devuelve cache GET cuando la red falla', () async {
    final AlmacenOffline offline = AlmacenOffline(
      _PersistenciaOfflineMemoria(),
    );
    final ClienteHttp clienteOnline = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[
        const _RespuestaFake.exito(<String, dynamic>{
          'ok': true,
          'nombreOlla': 'Olla Central',
        }),
      ]),
    );

    await clienteOnline.obtener('/mobile/dashboard');

    final ClienteHttp clienteOffline = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[const _RespuestaFake.sinRed()]),
    );
    final Response<dynamic> respuesta = await clienteOffline.obtener(
      '/mobile/dashboard',
    );

    expect(respuesta.statusMessage, 'offline-cache');
    expect(
      (respuesta.data as Map<String, dynamic>)['nombreOlla'],
      'Olla Central',
    );
  });

  test('encola mutaciones criticas cuando no hay red', () async {
    final AlmacenOffline offline = AlmacenOffline(
      _PersistenciaOfflineMemoria(),
    );
    final ClienteHttp cliente = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[const _RespuestaFake.sinRed()]),
    );

    final Response<dynamic> respuesta = await cliente.publicar(
      '/mobile/deliveries',
      cuerpo: <String, dynamic>{
        'beneficiaryIds': <String>['b1'],
      },
    );

    final List<MutacionOffline> pendientes = await offline.listarMutaciones();
    expect(respuesta.statusCode, 202);
    expect(pendientes, hasLength(1));
    expect(pendientes.single.ruta, '/mobile/deliveries');
  });

  test('no encola rutas de autenticacion', () async {
    final AlmacenOffline offline = AlmacenOffline(
      _PersistenciaOfflineMemoria(),
    );
    final ClienteHttp cliente = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[const _RespuestaFake.sinRed()]),
    );

    expect(
      () => cliente.publicar('/auth/login', cuerpo: <String, dynamic>{}),
      throwsA(isA<DioException>()),
    );
    expect(await offline.contarMutaciones(), 0);
  });

  test('sincroniza pendientes y limpia la cola en orden', () async {
    final AlmacenOffline offline = AlmacenOffline(
      _PersistenciaOfflineMemoria(),
    );
    await offline.agregarMutacion(
      metodo: 'POST',
      ruta: '/mobile/deliveries',
      cuerpo: <String, dynamic>{
        'beneficiaryIds': <String>['b1'],
      },
    );
    await offline.agregarMutacion(
      metodo: 'POST',
      ruta: '/mobile/inventory/movements',
      cuerpo: <String, dynamic>{'supplyItemId': 'i1'},
    );
    final ClienteHttp cliente = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[
        const _RespuestaFake.exito(<String, dynamic>{'ok': true}),
        const _RespuestaFake.exito(<String, dynamic>{'ok': true}),
      ]),
    );

    final int sincronizadas = await cliente.sincronizarPendientes();

    expect(sincronizadas, 2);
    expect(await offline.contarMutaciones(), 0);
  });

  test('autosincroniza pendientes luego de una peticion exitosa', () async {
    final AlmacenOffline offline = AlmacenOffline(
      _PersistenciaOfflineMemoria(),
    );
    await offline.agregarMutacion(
      metodo: 'POST',
      ruta: '/mobile/deliveries',
      cuerpo: <String, dynamic>{
        'beneficiaryIds': <String>['b1'],
      },
    );
    final ClienteHttp cliente = _cliente(
      offline: offline,
      dio: _dioFake(<_RespuestaFake>[
        const _RespuestaFake.exito(<String, dynamic>{'ok': true}),
        const _RespuestaFake.exito(<String, dynamic>{'ok': true}),
      ]),
    );

    await cliente.obtener('/mobile/dashboard');
    for (int intento = 0; intento < 10; intento++) {
      if (await offline.contarMutaciones() == 0) break;
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }

    expect(await offline.contarMutaciones(), 0);
  });
}
