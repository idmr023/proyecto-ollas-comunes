import 'package:auto_route/auto_route.dart';
import '../../features/auth/presentation/paginas/pagina_splash.dart';
import '../../features/home/presentation/paginas/pagina_home.dart';

part 'app_router.gr.dart';

/// Configuración de navegación de la app con AutoRoute.
@AutoRouterConfig()
class AppRouter extends RootStackRouter {
  @override
  List<AutoRoute> get routes => <AutoRoute>[
        AutoRoute(page: SplashRoute.page, initial: true),
        AutoRoute(page: HomeRoute.page),
      ];
}
