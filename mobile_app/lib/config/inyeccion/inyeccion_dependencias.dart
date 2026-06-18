import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import '../../core/red/cliente_http.dart';
import '../../core/sesion/almacen_sesion.dart';
import '../../features/auth/data/auth_api.dart';
import '../../features/auth/data/auth_repositorio_impl.dart';
import '../../features/auth/domain/repositorio_auth.dart';
import '../../features/dashboard/data/dashboard_api.dart';
import '../../features/dashboard/data/dashboard_repositorio_impl.dart';
import '../../features/dashboard/domain/repositorio_dashboard.dart';
import '../../features/inventario/data/inventario_api.dart';
import '../../features/inventario/data/inventario_repositorio_impl.dart';
import '../../features/inventario/domain/repositorio_inventario.dart';

/// Contenedor global de dependencias.
final GetIt sl = GetIt.instance;

/// Registra los servicios base de la app. Se invoca una sola vez al arrancar.
/// Convención: singleton para servicios y repositorios.
Future<void> configurarInyeccion() async {
  // Núcleo
  sl.registerLazySingleton<FlutterSecureStorage>(() => const FlutterSecureStorage());
  sl.registerLazySingleton<AlmacenSesion>(() => AlmacenSesion(sl<FlutterSecureStorage>()));
  sl.registerLazySingleton<ClienteHttp>(() => ClienteHttp(almacenSesion: sl<AlmacenSesion>()));

  // Feature: auth
  sl.registerLazySingleton<AuthApi>(() => AuthApi(sl<ClienteHttp>()));
  sl.registerLazySingleton<RepositorioAuth>(
    () => AuthRepositorioImpl(api: sl<AuthApi>(), almacenSesion: sl<AlmacenSesion>()),
  );

  // Feature: dashboard
  sl.registerLazySingleton<DashboardApi>(() => DashboardApi(sl<ClienteHttp>()));
  sl.registerLazySingleton<RepositorioDashboard>(() => DashboardRepositorioImpl(sl<DashboardApi>()));

  // Feature: inventario
  sl.registerLazySingleton<InventarioApi>(() => InventarioApi(sl<ClienteHttp>()));
  sl.registerLazySingleton<RepositorioInventario>(() => InventarioRepositorioImpl(sl<InventarioApi>()));
}
