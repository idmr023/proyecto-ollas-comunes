import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/inyeccion/inyeccion_dependencias.dart';
import 'config/router/app_router.dart';
import 'core/tema/tema_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await configurarInyeccion();
  runApp(const AplicacionSigoOllas());
}

/// Raíz de la aplicación SIGO-OLLAS.
class AplicacionSigoOllas extends StatefulWidget {
  const AplicacionSigoOllas({super.key});

  @override
  State<AplicacionSigoOllas> createState() => _AplicacionSigoOllasState();
}

class _AplicacionSigoOllasState extends State<AplicacionSigoOllas> {
  final AppRouter _router = AppRouter();

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      child: MaterialApp.router(
        title: 'SIGO-OLLAS',
        debugShowCheckedModeBanner: false,
        theme: TemaApp.construirTemaClaro(),
        routerConfig: _router.config(),
      ),
    );
  }
}
