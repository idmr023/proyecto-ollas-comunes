import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sigo_ollas/config/inyeccion/inyeccion_dependencias.dart';
import 'package:sigo_ollas/core/offline/almacen_offline.dart';
import 'package:sigo_ollas/core/red/cliente_http.dart';
import 'package:sigo_ollas/core/red/resultado.dart';
import 'package:sigo_ollas/core/sesion/almacen_sesion.dart';
import 'package:sigo_ollas/features/auth/domain/entidades/usuario.dart';
import 'package:sigo_ollas/features/auth/domain/repositorio_auth.dart';
import 'package:sigo_ollas/features/auth/domain/resultado_login.dart';
import 'package:sigo_ollas/features/mas/presentation/pagina_mas.dart';

class _RepositorioAuthFalso implements RepositorioAuth {
  @override
  Future<Resultado<ResultadoLogin>> iniciarSesion({
    required String email,
    required String password,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<Resultado<Usuario>> verificarCodigo({
    required String email,
    required String tempToken,
    required String codigo,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<Resultado<Usuario>> obtenerUsuarioActual() async {
    return const Resultado<Usuario>.exito(
      Usuario(
        id: 'u1',
        email: 'dirigenta@sigo.pe',
        nombreCompleto: 'Rosa Flores',
        rol: 'manager',
        tenantId: 't1',
        nombreTenant: 'Olla Central',
      ),
    );
  }

  @override
  Future<bool> haySesionActiva() async => true;

  @override
  Future<void> cerrarSesion() async {}
}

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
  @override
  Future<void> escribir({required String clave, required String valor}) async {}

  @override
  Future<String?> leer({required String clave}) async => null;

  @override
  Future<void> eliminar({required String clave}) async {}
}

Future<void> _montarPaginaMas(WidgetTester tester) async {
  await tester.pumpWidget(
    const ProviderScope(child: MaterialApp(home: PaginaMas())),
  );
  await tester.pumpAndSettle();
}

void main() {
  late AlmacenOffline almacenOffline;

  setUp(() {
    almacenOffline = AlmacenOffline(_PersistenciaOfflineMemoria());
    sl.registerLazySingleton<RepositorioAuth>(() => _RepositorioAuthFalso());
    sl.registerLazySingleton<AlmacenOffline>(() => almacenOffline);
    sl.registerLazySingleton<AlmacenSesion>(
      () => AlmacenSesion(_PersistenciaSesionMemoria()),
    );
    sl.registerLazySingleton<ClienteHttp>(
      () => ClienteHttp(
        almacenSesion: sl<AlmacenSesion>(),
        almacenOffline: sl<AlmacenOffline>(),
        dio: Dio(),
      ),
    );
  });

  tearDown(() => sl.reset());

  testWidgets('muestra estado sincronizado cuando no hay pendientes', (
    WidgetTester tester,
  ) async {
    await _montarPaginaMas(tester);

    expect(find.text('Datos sincronizados'), findsOneWidget);
    expect(find.text('Revisar sincronizacion'), findsOneWidget);
    expect(find.text('Rosa Flores'), findsOneWidget);
    expect(find.text('Olla Central'), findsOneWidget);
  });

  testWidgets('muestra contador de pendientes offline', (
    WidgetTester tester,
  ) async {
    await almacenOffline.agregarMutacion(
      metodo: 'POST',
      ruta: '/mobile/deliveries',
    );

    await _montarPaginaMas(tester);

    expect(find.text('1 accion(es) pendiente(s)'), findsOneWidget);
    expect(find.text('Sincronizar pendientes (1)'), findsOneWidget);
  });
}
