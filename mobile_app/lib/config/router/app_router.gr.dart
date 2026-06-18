// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'app_router.dart';

/// generated route for
/// [PaginaHome]
class HomeRoute extends PageRouteInfo<void> {
  const HomeRoute({List<PageRouteInfo>? children})
    : super(HomeRoute.name, initialChildren: children);

  static const String name = 'HomeRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaHome();
    },
  );
}

/// generated route for
/// [PaginaLogin]
class LoginRoute extends PageRouteInfo<void> {
  const LoginRoute({List<PageRouteInfo>? children})
    : super(LoginRoute.name, initialChildren: children);

  static const String name = 'LoginRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaLogin();
    },
  );
}

/// generated route for
/// [PaginaSplash]
class SplashRoute extends PageRouteInfo<void> {
  const SplashRoute({List<PageRouteInfo>? children})
    : super(SplashRoute.name, initialChildren: children);

  static const String name = 'SplashRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const PaginaSplash();
    },
  );
}

/// generated route for
/// [PaginaVerificacion]
class VerificacionRoute extends PageRouteInfo<VerificacionRouteArgs> {
  VerificacionRoute({
    Key? key,
    required ResultadoLogin datosLogin,
    List<PageRouteInfo>? children,
  }) : super(
         VerificacionRoute.name,
         args: VerificacionRouteArgs(key: key, datosLogin: datosLogin),
         initialChildren: children,
       );

  static const String name = 'VerificacionRoute';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final args = data.argsAs<VerificacionRouteArgs>();
      return PaginaVerificacion(key: args.key, datosLogin: args.datosLogin);
    },
  );
}

class VerificacionRouteArgs {
  const VerificacionRouteArgs({this.key, required this.datosLogin});

  final Key? key;

  final ResultadoLogin datosLogin;

  @override
  String toString() {
    return 'VerificacionRouteArgs{key: $key, datosLogin: $datosLogin}';
  }
}
