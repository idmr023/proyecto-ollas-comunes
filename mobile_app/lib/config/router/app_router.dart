import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../features/auth/domain/resultado_login.dart';
import '../../features/auth/presentation/paginas/pagina_login.dart';
import '../../features/auth/presentation/paginas/pagina_splash.dart';
import '../../features/auth/presentation/paginas/pagina_verificacion.dart';
import '../../features/home/presentation/paginas/pagina_home.dart';

part 'app_router.gr.dart';

/// Configuración de navegación de la app con AutoRoute.
@AutoRouterConfig()
class AppRouter extends RootStackRouter {
  @override
  List<AutoRoute> get routes => <AutoRoute>[
        AutoRoute(page: SplashRoute.page, initial: true),
        AutoRoute(page: LoginRoute.page),
        AutoRoute(page: VerificacionRoute.page),
        AutoRoute(page: HomeRoute.page),
      ];
}
