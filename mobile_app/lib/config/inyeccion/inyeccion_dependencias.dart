import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import '../../core/red/cliente_http.dart';
import '../../core/sesion/almacen_sesion.dart';

/// Contenedor global de dependencias.
final GetIt sl = GetIt.instance;

/// Registra los servicios base de la app. Se invoca una sola vez al arrancar.
/// Convención: singleton para servicios y repositorios.
Future<void> configurarInyeccion() async {
  sl.registerLazySingleton<FlutterSecureStorage>(() => const FlutterSecureStorage());
  sl.registerLazySingleton<AlmacenSesion>(() => AlmacenSesion(sl<FlutterSecureStorage>()));
  sl.registerLazySingleton<ClienteHttp>(() => ClienteHttp(almacenSesion: sl<AlmacenSesion>()));
}
