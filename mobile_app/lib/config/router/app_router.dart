import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import '../../features/auth/domain/resultado_login.dart';
import '../../features/auth/presentation/paginas/pagina_login.dart';
import '../../features/auth/presentation/paginas/pagina_splash.dart';
import '../../features/auth/presentation/paginas/pagina_verificacion.dart';
import '../../features/home/presentation/paginas/pagina_home.dart';
import '../../features/inventario/domain/entidades/insumo.dart';
import '../../features/inventario/presentation/paginas/pagina_detalle_insumo.dart';
import '../../features/inventario/presentation/paginas/pagina_movimiento.dart';
import '../../features/padron/domain/entidades/beneficiario.dart';
import '../../features/padron/presentation/paginas/pagina_ficha_beneficiario.dart';
import '../../features/padron/presentation/paginas/pagina_formulario_beneficiario.dart';
import '../../features/alertas/presentation/pagina_alertas.dart';
import '../../features/menu_ia/presentation/pagina_menu_ia.dart';
import '../../features/evidencias/presentation/pagina_evidencias.dart';
import '../../features/calculadora/presentation/pagina_calculadora.dart';

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
        AutoRoute(page: DetalleInsumoRoute.page),
        AutoRoute(page: MovimientoRoute.page),
        AutoRoute(page: FichaBeneficiarioRoute.page),
        AutoRoute(page: FormularioBeneficiarioRoute.page),
        AutoRoute(page: AlertasRoute.page),
        AutoRoute(page: MenuIaRoute.page),
        AutoRoute(page: EvidenciasRoute.page),
        AutoRoute(page: CalculadoraRoute.page),
      ];
}
